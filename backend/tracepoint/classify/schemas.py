"""Structured-output schemas for the classification and segmentation jobs."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

FeedbackType = Literal["Likes", "Difficult to Use", "Defect", "Wants"]
FEEDBACK_TYPES: tuple[str, ...] = ("Likes", "Difficult to Use", "Defect", "Wants")


class NewThemeProposal(BaseModel):
    name: str
    closest_existing: str
    reason: str


class Label(BaseModel):
    feedback_type: FeedbackType
    level2: str
    level3: str
    confidence: float
    rationale: str
    new_theme: NewThemeProposal | None = None


class GapClassification(BaseModel):
    is_product_feedback: bool
    labels: list[Label]
    note: str | None = None


class Segment(BaseModel):
    text: str
    is_product_feedback: bool
    reason: str


class Segmentation(BaseModel):
    segments: list[Segment]
