from app import create_app
import os

app = create_app(os.environ.get('FLASK_ENV', 'development'))
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule}")
