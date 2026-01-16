from app import create_app, db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Tables index: {tables}")
    if 'system_settings' in tables:
        print("Table 'system_settings' exists.")
        from app.models import SystemSetting
        settings = SystemSetting.query.all()
        print(f"Settings found: {len(settings)}")
        for s in settings:
            print(f" - {s.key}: {s.value}")
    else:
        print("Table 'system_settings' DOES NOT exist.")
