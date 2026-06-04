"""Semantic version comparison utilities."""
import re
from typing import List


def _parse_version(version_str: str) -> List[int]:
    """Parse a version string into a list of integers.

    Handles formats: '4', '4.2', '4.2.1', '5.0.0-beta', etc.
    """
    if not version_str:
        return [0]
    # Strip any suffix after a hyphen (e.g. '5.0.0-beta' -> '5.0.0')
    version_str = version_str.split('-')[0].strip()
    parts = re.split(r'[.\s]', version_str)
    result = []
    for part in parts:
        try:
            result.append(int(part))
        except ValueError:
            result.append(0)
    return result or [0]


def semver_lt(v1: str, v2: str) -> bool:
    """Return True if version v1 is strictly less than v2."""
    p1 = _parse_version(v1)
    p2 = _parse_version(v2)
    # Pad shorter list with zeros
    length = max(len(p1), len(p2))
    p1.extend([0] * (length - len(p1)))
    p2.extend([0] * (length - len(p2)))
    return p1 < p2


def semver_lte(v1: str, v2: str) -> bool:
    """Return True if v1 <= v2."""
    return v1 == v2 or semver_lt(v1, v2)


def semver_eq(v1: str, v2: str) -> bool:
    """Return True if v1 == v2 (normalised)."""
    return _parse_version(v1) == _parse_version(v2)
