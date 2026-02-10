import datetime

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from data.connection import db_cursor
from data.users import User


@dataclass
class Bloom:
    id: int
    sender: User
    content: str
    sent_timestamp: datetime.datetime
    rebloomer: Optional[str] = None  # new optional field   
    rebloom_count: int = 0
    last_rebloomed_at: Optional[datetime.datetime] = None

def add_bloom(*, sender: User, content: str) -> Bloom:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s)",
            dict(
                bloom_id=bloom_id,
                sender_id=sender.id,
                content=content,
                timestamp=datetime.datetime.now(datetime.UTC),
            ),
        )
        for hashtag in hashtags:
            cur.execute(
                "INSERT INTO hashtags (hashtag, bloom_id) VALUES (%(hashtag)s, %(bloom_id)s)",
                dict(hashtag=hashtag, bloom_id=bloom_id),
            )


def get_blooms_for_user(
    username: str, *, before: Optional[int] = None, limit: Optional[int] = None
) -> List[Bloom]:
    with db_cursor() as cur:
        kwargs = {
            "sender_username": username,
        }
        if before is not None:
            before_clause = "AND send_timestamp < %(before_limit)s"
            kwargs["before_limit"] = before
        else:
            before_clause = ""

        limit_clause = make_limit_clause(limit, kwargs)

        cur.execute(
            f"""SELECT
              blooms.id, users.username, content, send_timestamp,
              COUNT(r.id) AS rebloom_count,
              MAX(r.rebloomed_at) AS last_rebloomed_at
            FROM blooms
              INNER JOIN users ON users.id = blooms.sender_id
              LEFT JOIN reblooms r ON r.original_bloom_id = blooms.id
            WHERE
              username = %(sender_username)s
              GROUP BY
               blooms.id, users.username, content, send_timestamp
              {before_clause}
            ORDER BY send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp , rebloom_count, last_rebloomed_at= row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                    rebloom_count=rebloom_count,
                    last_rebloomed_at=last_rebloomed_at,
                )
            )
    return blooms

# Fetch all reblooms made by a user
#  returning them as Bloom objects with original content 
# but marked as rebloomed by the user
def get_reblooms_for_user(
    username: str,
    *,
    before: Optional[datetime.datetime] = None,
    limit: Optional[int] = None,
) -> List[Bloom]:
    with db_cursor() as cur:
        kwargs = {
            "username": username,
        }

        if before is not None:
            before_clause = "AND r.rebloomed_at < %(before_limit)s"
            kwargs["before_limit"] = before
        else:
            before_clause = ""

        limit_clause = make_limit_clause(limit, kwargs)

        cur.execute(
            f"""
            SELECT
                b.id,
                us.username AS original_sender,
                b.content,
                r.rebloomed_at,
                ur.username AS rebloomer_username,
                rc.rebloom_count,
                rc.last_rebloomed_at
            FROM
                reblooms r
                INNER JOIN blooms b ON r.original_bloom_id = b.id
                INNER JOIN users ur ON r.rebloomed_by = ur.id
                INNER JOIN users us ON b.sender_id = us.id
                INNER JOIN (
                    SELECT
                        original_bloom_id,
                        COUNT(*) AS rebloom_count,
                        MAX(rebloomed_at) AS last_rebloomed_at
                    FROM reblooms
                    GROUP BY original_bloom_id
                ) rc ON rc.original_bloom_id = b.id
            WHERE
                ur.username = %(username)s
                {before_clause}
            ORDER BY
                r.rebloomed_at DESC
            {limit_clause}

            """,
            kwargs,
        )

        rows = cur.fetchall()
        reblooms = []

        for row in rows:
            bloom_id, original_sender, content, timestamp, rebloomer_username , rebloom_count, last_rebloomed_at = row
            reblooms.append(
                Bloom(
                    id=bloom_id,
                    sender=original_sender,      # the user who performed the rebloom
                    content=content,              # content of the original bloom
                    sent_timestamp=timestamp,     # time when the rebloom happened
                    rebloomer=rebloomer_username ,      # user who rebloomed
                    rebloom_count=rebloom_count,
                    last_rebloomed_at=last_rebloomed_at
                )
            )

    return reblooms


def get_bloom(bloom_id: int) -> Optional[Bloom]:
    with db_cursor() as cur:
        cur.execute(
            "SELECT blooms.id, users.username, content, send_timestamp FROM blooms INNER JOIN users ON users.id = blooms.sender_id WHERE blooms.id = %s",
            (bloom_id,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        bloom_id, sender_username, content, timestamp = row
        return Bloom(
            id=bloom_id,
            sender=sender_username,
            content=content,
            sent_timestamp=timestamp,
        )


def get_blooms_with_hashtag(
    hashtag_without_leading_hash: str, *, limit: int = None
) -> List[Bloom]:
    kwargs = {
        "hashtag_without_leading_hash": hashtag_without_leading_hash,
    }
    limit_clause = make_limit_clause(limit, kwargs)
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              blooms.id, users.username, content, send_timestamp
            FROM
              blooms INNER JOIN hashtags ON blooms.id = hashtags.bloom_id INNER JOIN users ON blooms.sender_id = users.id
            WHERE
              hashtag = %(hashtag_without_leading_hash)s
            ORDER BY send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                )
            )
    return blooms


def make_limit_clause(limit: Optional[int], kwargs: Dict[Any, Any]) -> str:
    if limit is not None:
        limit_clause = "LIMIT %(limit)s"
        kwargs["limit"] = limit
    else:
        limit_clause = ""
    return limit_clause

#Return True if the user has already rebloomed this bloom.
def has_user_rebloomed(original_bloom_id: int, user_id: int) -> bool :
    with db_cursor() as cur :
        cur.execute("select 1 from reblooms where original_bloom_id=%s and rebloomed_by=%s",(original_bloom_id,user_id))
        return cur.fetchone() is not None 

#Insert a rebloom record and return its id.
def add_rebloom(original_bloom_id: int, user_id: int) -> int :
    with db_cursor() as cur :
        cur.execute("insert into reblooms (original_bloom_id, rebloomed_by) values(%s, %s)  returning id",(original_bloom_id, user_id))
        return cur.fetchone()[0]