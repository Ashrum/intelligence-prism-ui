#!/usr/bin/env python3
"""Independent design oracles, not business implementation acceptance.
Writes only review-v07r1-boundary-fixtures.json beside this file.
"""
from __future__ import annotations
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, TZPATH
import hashlib
import json
import sys

RULE = 'design-oracle-v07r1'
LOOKUP = {'易': Decimal('80'), '中': Decimal('60'), '难': Decimal('40'),
          '基础': Decimal('80'), '巩固': Decimal('60'), '提升': Decimal('40')}


def expectation(row):
    """Do not let a lower-tier source silently resolve a same-tier conflict/withdrawal."""
    state = row.get('explicit_state', 'missing')
    sources = row.get('explicit_sources', [])
    if state in {'conflict', 'invalidated', 'unverified'}:
        return {'state': 'pending-verification', 'rate': None, 'source': None, 'reason': state}
    if state == 'qualified':
        values = set()
        for src in sources:
            if not src.get('version') or src.get('eligible') is not True:
                return {'state': 'pending-verification', 'rate': None, 'source': None, 'reason': 'source-not-qualified'}
            r = Decimal(str(src['rate']))
            if not r.is_finite() or not 0 <= r <= 100:
                return {'state': 'pending-verification', 'rate': None, 'source': None, 'reason': 'invalid-rate'}
            values.add(r)
        if len(values) > 1:
            return {'state': 'pending-verification', 'rate': None, 'source': None, 'reason': 'same-tier-conflict'}
        if values:
            return {'state': 'available', 'rate': str(next(iter(values))), 'source': 'versioned-item-expectation', 'reason': None}
        return {'state': 'pending-verification', 'rate': None, 'source': None, 'reason': 'qualified-source-missing'}
    if row.get('difficulty_eligible') is True and row.get('question_version') and row.get('difficulty_rule_version'):
        value = LOOKUP.get(row.get('difficulty'))
        if value is not None:
            return {'state': 'available', 'rate': str(value), 'source': 'approved-difficulty-fallback-v0', 'reason': None}
    return {'state': 'incomparable', 'rate': None, 'source': None, 'reason': 'both-sources-unavailable'}


def detection(rows):
    resolved = [expectation(row) for row in rows]
    points = [Decimal(str(row['max'])) for row in rows]
    scores = [Decimal(str(row['score'])) for row in rows]
    if any(point <= 0 or score < 0 or score > point for score, point in zip(scores, points)):
        raise ValueError('invalid observed score or max')
    total = sum(points)
    actual = sum(scores) / total * 100
    if any(item['state'] != 'available' for item in resolved):
        return {'state': 'incomparable', 'actual': str(actual), 'expected': None, 'gap': None,
                'sources': resolved}
    expected = sum(point * Decimal(item['rate']) / 100 for point, item in zip(points, resolved)) / total * 100
    return {'state': 'available', 'actual': str(actual), 'expected': str(expected), 'gap': str(actual - expected), 'sources': resolved}


def school_dates(row):
    """Use trusted school event dates, otherwise convert aware event instants through school IANA zone.
    device_zone is recorded only as a fixture input and is deliberately not read.
    created_at/grading_at may not substitute for an event date.
    """
    event_dates = row.get('trusted_school_event_dates')
    if event_dates:
        if len(event_dates) != 2 or not all(event_dates):
            return {'state': 'interval-unknown', 'reason': 'missing-event-date'}
        before, after = [date.fromisoformat(item) for item in event_dates]
        delta = (after - before).days
        return {'state': 'included' if delta >= 14 else 'short-term-only', 'school_dates': event_dates,
                'calendar_days': delta, 'elapsed_hours': None, 'utc_date_days': None}
    if not row.get('before') or not row.get('after'):
        return {'state': 'interval-unknown', 'reason': 'missing-event-time'}
    if not row.get('school_zone'):
        return {'state': 'interval-unknown', 'reason': 'missing-required-school-zone'}
    try:
        zone = ZoneInfo(row['school_zone'])
    except ZoneInfoNotFoundError:
        return {'state': 'interval-unknown', 'reason': 'unknown-school-zone'}
    instants = [datetime.fromisoformat(row[key].replace('Z', '+00:00')) for key in ('before', 'after')]
    if any(item.tzinfo is None for item in instants):
        return {'state': 'interval-unknown', 'reason': 'event-instant-offset-missing'}
    local = [item.astimezone(zone) for item in instants]
    utc = [item.astimezone(timezone.utc) for item in instants]
    delta = (local[1].date() - local[0].date()).days
    return {'state': 'included' if delta >= 14 else 'short-term-only',
            'school_dates': [item.date().isoformat() for item in local],
            'school_local_times': [item.isoformat() for item in local],
            'calendar_days': delta,
            'elapsed_hours': (utc[1] - utc[0]).total_seconds() / 3600,
            'utc_date_days': (utc[1].date() - utc[0].date()).days}

cases = []
def check(case_id, kind, inputs, expected):
    actual = {'MET10-source': expectation, 'MET10-detection': detection, 'MET08': school_dates}[kind](inputs)
    for key, value in expected.items():
        if actual.get(key) != value:
            raise AssertionError(f'{case_id}: {key}: {actual.get(key)!r} != {value!r}')
    cases.append({'id': case_id, 'kind': kind, 'input': inputs, 'expected': expected, 'actual': actual, 'passed': True})
    return actual

fallback = {'difficulty': '提升', 'difficulty_eligible': True, 'question_version': 'q-v1', 'difficulty_rule_version': 'difficulty-v0'}
explicit = {'explicit_state': 'qualified', 'explicit_sources': [{'id': 'exp-1', 'version': 'exp-v3', 'eligible': True, 'rate': 65}]}
check('MET10-01', 'MET10-source', explicit | fallback,
      {'state': 'available', 'rate': '65', 'source': 'versioned-item-expectation'})
check('MET10-02', 'MET10-source', explicit | {'difficulty': None},
      {'state': 'available', 'rate': '65', 'source': 'versioned-item-expectation'})
mixed = [
    {'max': 2, 'score': 1, 'explicit_state': 'qualified', 'explicit_sources': [{'version': 'exp-v1', 'eligible': True, 'rate': 75}], **fallback},
    {'max': 3, 'score': 3, **fallback, 'difficulty': '巩固'},
    {'max': 5, 'score': 3, **fallback},
]
check('MET10-03', 'MET10-detection', mixed, {'state': 'available', 'actual': '70.0', 'expected': '53.00', 'gap': '17.00'})
check('MET10-04', 'MET10-detection', [mixed[0], {'max': 3, 'score': 3, 'difficulty': None}],
      {'state': 'incomparable', 'actual': '80.0', 'expected': None, 'gap': None})
check('MET10-05', 'MET10-source', explicit | fallback | {'explicit_sources': [{'version': 'a', 'eligible': True, 'rate': 65}, {'version': 'b', 'eligible': True, 'rate': 70}]},
      {'state': 'pending-verification', 'rate': None, 'reason': 'same-tier-conflict'})
check('MET10-06', 'MET10-source', explicit | fallback | {'explicit_state': 'invalidated'},
      {'state': 'pending-verification', 'rate': None, 'reason': 'invalidated'})
check('MET10-07', 'MET10-source', fallback | {'difficulty_eligible': False},
      {'state': 'incomparable', 'rate': None, 'reason': 'both-sources-unavailable'})
check('MET10-08', 'MET10-source', explicit | fallback | {'explicit_sources': [{'version': None, 'eligible': True, 'rate': 65}]},
      {'state': 'pending-verification', 'rate': None, 'reason': 'source-not-qualified'})

base = {'school_zone': 'Asia/Taipei', 'before': '2026-10-01T16:00:00+08:00', 'after': '2026-10-15T08:00:00+08:00'}
first = check('MET08-01', 'MET08', base,
      {'state': 'included', 'calendar_days': 14, 'elapsed_hours': 328.0, 'utc_date_days': 14})
check('MET08-02', 'MET08', {'school_zone': 'Asia/Taipei', 'before': '2026-10-01T20:00:00Z', 'after': '2026-10-15T10:00:00Z'},
      {'state': 'short-term-only', 'calendar_days': 13, 'elapsed_hours': 326.0, 'utc_date_days': 14,
       'school_dates': ['2026-10-02', '2026-10-15']})
check('MET08-03', 'MET08', {'school_zone': 'Asia/Taipei', 'before': '2026-10-01T10:00:00Z', 'after': '2026-10-14T20:00:00Z'},
      {'state': 'included', 'calendar_days': 14, 'elapsed_hours': 322.0, 'utc_date_days': 13,
       'school_dates': ['2026-10-01', '2026-10-15']})
check('MET08-04', 'MET08', {'school_zone': 'America/New_York', 'before': '2026-03-01T10:00:00-05:00', 'after': '2026-03-15T10:00:00-04:00'},
      {'state': 'included', 'calendar_days': 14, 'elapsed_hours': 335.0})
check('MET08-05', 'MET08', {'school_zone': 'America/New_York', 'before': '2026-10-25T10:00:00-04:00', 'after': '2026-11-08T10:00:00-05:00'},
      {'state': 'included', 'calendar_days': 14, 'elapsed_hours': 337.0})
for i, device in enumerate(['America/Los_Angeles', 'Asia/Tokyo', 'UTC'], start=6):
    result = check(f'MET08-{i:02d}', 'MET08', base | {'device_zone': device},
                  {'state': 'included', 'calendar_days': 14, 'elapsed_hours': 328.0})
    assert result == first
check('MET08-09', 'MET08', {'school_zone': 'Asia/Taipei', 'before': base['before'], 'after': None,
                           'grading_at': '2026-10-15T09:00:00+08:00', 'created_at': '2026-10-15T09:05:00+08:00'},
      {'state': 'interval-unknown', 'reason': 'missing-event-time'})
check('MET08-10', 'MET08', base | {'school_zone': None, 'device_zone': 'Asia/Taipei'},
      {'state': 'interval-unknown', 'reason': 'missing-required-school-zone'})
check('MET08-11', 'MET08', {'trusted_school_event_dates': ['2026-10-01', '2026-10-15'], 'school_zone': None},
      {'state': 'included', 'calendar_days': 14, 'elapsed_hours': None})
check('MET08-12', 'MET08', base | {'after': '2026-10-15T08:00:00'},
      {'state': 'interval-unknown', 'reason': 'event-instant-offset-missing'})

script = Path(__file__).resolve()
result = {'generated_at': datetime.now(timezone.utc).isoformat(), 'rule': RULE,
          'status': 'passed', 'passed': len(cases), 'total': len(cases),
          'implementation': 'Python standard library datetime + zoneinfo; Decimal for MET10',
          'python': sys.version, 'tzpath': [str(item) for item in TZPATH],
          'script_sha256': hashlib.sha256(script.read_bytes()).hexdigest(),
          'scope': 'Independent design boundary fixtures only; no business application/model/service acceptance',
          'notes': [
              'MET10 source availability never supplies MET07/08 qualification; this fixture does not authorize any evidence use.',
              'Invalidated or conflicting upper-tier sources stay pending until an approved rebinding/revision; a fallback does not bypass qualification.',
              'School-local trusted event dates need no invented timestamp or timezone; instant-only inputs require the registered school IANA zone.',
              'An offset-free local time string is not silently treated as a trusted school event date; explicit date provenance is required.',
              'Calendar >=14 is only the MET08 time predicate; all other relation/independence/exposure/qualification conditions must still pass.'
          ], 'cases': cases}
output = script.with_suffix('.json')
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': result['status'], 'passed': len(cases), 'total': len(cases), 'output': str(output)}, ensure_ascii=False))
