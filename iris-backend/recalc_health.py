import sys
sys.path.insert(0, '.')
from app import create_app
from app.services import health_service

app = create_app('development')
with app.app_context():
    results = health_service.recalculate_all()
    for r in results:
        if r.get('success'):
            print(f"{r['account_id']}: {r['health_score']:>3}  {r['health_status']}")
        else:
            print(f"{r['account_id']}: ERROR - {r.get('error')}")
    print(f'Done: {len(results)} accounts recalculated.')
