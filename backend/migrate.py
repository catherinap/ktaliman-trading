import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('.env.local')

from app.db import engine
from sqlalchemy import text

with engine.begin() as conn:
    for col, t in [
        ('funds_index_3w_avg',       'FLOAT'),
        ('funds_index_8w_avg',       'FLOAT'),
        ('funds_index_direction',    'VARCHAR(10)'),
        ('funds_index_momentum',     'FLOAT'),
        ('funds_index_acceleration', 'VARCHAR(15)'),
        ('funds_index_wow_change',   'FLOAT'),
    ]:
        conn.execute(text(f'ALTER TABLE cot_analytics ADD COLUMN IF NOT EXISTS {col} {t}'))
        print(f'  + {col}')

print('Migration done!')