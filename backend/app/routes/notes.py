"""
Research Notes — зберігання AI аналізів в PostgreSQL.
"""
import json as json_lib
from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()


def init_notes_table():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS research_notes (
                id          SERIAL PRIMARY KEY,
                type        VARCHAR(30) NOT NULL,
                title       VARCHAR(200) NOT NULL,
                content     TEXT NOT NULL,
                is_pinned   BOOLEAN DEFAULT FALSE,
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                metadata    TEXT
            );
        """))


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/notes")
def get_notes(type: str = "all"):
    init_notes_table()
    where = "" if type == "all" else "WHERE type = :type"
    with engine.connect() as conn:
        rows = conn.execute(text(f"""
            SELECT id, type, title, content, is_pinned, created_at, metadata
            FROM research_notes
            {where}
            ORDER BY is_pinned DESC, created_at DESC
        """), {"type": type} if type != "all" else {}).mappings().all()

    items = []
    for row in rows:
        d = dict(row)
        d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None
        try:
            d["metadata"] = json_lib.loads(d["metadata"] or "{}")
        except Exception:
            d["metadata"] = {}
        items.append(d)

    return {"items": items, "total": len(items)}


@router.post("/notes")
def save_note(payload: dict):
    init_notes_table()
    note_type = payload.get("type", "general")
    title     = payload.get("title", "AI Analysis")
    content   = payload.get("content", "")
    metadata  = json_lib.dumps(payload.get("metadata", {}))

    if not content.strip():
        return {"ok": False, "message": "Content is empty"}

    with engine.begin() as conn:
        row = conn.execute(text("""
            INSERT INTO research_notes (type, title, content, metadata)
            VALUES (:type, :title, :content, :metadata)
            RETURNING id, created_at
        """), {
            "type": note_type, "title": title,
            "content": content, "metadata": metadata,
        }).mappings().first()

    return {
        "ok": True,
        "id": row["id"],
        "created_at": row["created_at"].isoformat(),
    }


@router.patch("/notes/{note_id}/pin")
def toggle_pin(note_id: int):
    init_notes_table()
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT is_pinned FROM research_notes WHERE id = :id"),
            {"id": note_id}
        ).mappings().first()
        if not row:
            return {"ok": False, "message": "Note not found"}
        new_val = not row["is_pinned"]
        conn.execute(
            text("UPDATE research_notes SET is_pinned = :val WHERE id = :id"),
            {"val": new_val, "id": note_id}
        )
    return {"ok": True, "is_pinned": new_val}


@router.delete("/notes/{note_id}")
def delete_note(note_id: int):
    init_notes_table()
    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM research_notes WHERE id = :id"),
            {"id": note_id}
        )
    return {"ok": True}


@router.delete("/notes")
def clear_notes(type: str = "all"):
    init_notes_table()
    with engine.begin() as conn:
        if type == "all":
            conn.execute(text("DELETE FROM research_notes"))
        else:
            conn.execute(
                text("DELETE FROM research_notes WHERE type = :type"),
                {"type": type}
            )
    return {"ok": True}
