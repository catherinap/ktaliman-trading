# -*- coding: utf-8 -*-
import os
import io
import csv
import zipfile
from datetime import datetime

import pandas as pd
import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env.local')

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/cot_db')
engine = create_engine(DATABASE_URL)

URL_TFF_WEEKLY = 'https://www.cftc.gov/dea/newcot/FinFutWk.txt'
URL_DISAGG_WEEKLY = 'https://www.cftc.gov/dea/newcot/f_disagg.txt'

HISTORICAL_TFF_URLS = {
    2016: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2016.zip',
    2017: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2017.zip',
    2018: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2018.zip',
    2019: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2019.zip',
    2020: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2020.zip',
    2021: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2021.zip',
    2022: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2022.zip',
    2023: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2023.zip',
    2024: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2024.zip',
    2025: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2025.zip',
    2026: 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2026.zip',
}

HISTORICAL_DISAGG_URLS = {
    2016: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2016.zip',
    2017: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2017.zip',
    2018: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2018.zip',
    2019: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2019.zip',
    2020: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2020.zip',
    2021: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2021.zip',
    2022: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2022.zip',
    2023: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2023.zip',
    2024: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2024.zip',
    2025: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2025.zip',
    2026: 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2026.zip',
}

def normalize_market_name(name: str) -> str:
    return ' '.join(str(name).upper().replace('"', '').split())

ASSET_MAP = {
    # FX
    'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'AUD', 'name': 'Australian Dollar', 'sector': 'FX'},
    'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'CAD', 'name': 'Canadian Dollar', 'sector': 'FX'},
    'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'CHF', 'name': 'Swiss Franc', 'sector': 'FX'},
    'BRITISH POUND - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'GBP', 'name': 'British Pound', 'sector': 'FX'},
    'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'GBP', 'name': 'British Pound', 'sector': 'FX'},
    'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'JPY', 'name': 'Japanese Yen', 'sector': 'FX'},
    'EURO FX - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'EUR', 'name': 'Euro', 'sector': 'FX'},
    'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'NZD', 'name': 'New Zealand Dollar', 'sector': 'FX'},
    'NZ DOLLAR - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'NZD', 'name': 'New Zealand Dollar', 'sector': 'FX'},
    'U.S. DOLLAR INDEX - ICE FUTURES U.S.': {'symbol': 'USD', 'name': 'US Dollar Index', 'sector': 'FX'},
    'USD INDEX - ICE FUTURES U.S.': {'symbol': 'USD', 'name': 'US Dollar Index', 'sector': 'FX'},
    'US DOLLAR INDEX - ICE FUTURES U.S.': {'symbol': 'USD', 'name': 'US Dollar Index', 'sector': 'FX'},

    # Indices
    'E-MINI S&P 500 STOCK INDEX - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'SPX', 'name': 'SP 500', 'sector': 'IDX'},
    'E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'SPX', 'name': 'SP 500', 'sector': 'IDX'},
    'S&P 500 Consolidated - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'SPX', 'name': 'SP 500', 'sector': 'IDX'},
    'NASDAQ-100 STOCK INDEX (MINI) - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'NDX', 'name': 'Nasdaq', 'sector': 'IDX'},
    'NASDAQ-100 Consolidated - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'NDX', 'name': 'Nasdaq', 'sector': 'IDX'},
    'DJIA x$5 - CHICAGO BOARD OF TRADE': {'symbol': 'DJIA', 'name': 'Dow Jones', 'sector': 'IDX'},
    'DJIA x $5 - CHICAGO BOARD OF TRADE': {'symbol': 'DJIA', 'name': 'Dow Jones', 'sector': 'IDX'},
    'DJIA Consolidated - CHICAGO BOARD OF TRADE': {'symbol': 'DJIA', 'name': 'Dow Jones', 'sector': 'IDX'},
    'CBOE VOLATILITY INDEX - CBOE FUTURES EXCHANGE': {'symbol': 'VIX', 'name': 'VIX', 'sector': 'IDX'},
    'VIX FUTURES - CBOE FUTURES EXCHANGE': {'symbol': 'VIX', 'name': 'VIX', 'sector': 'IDX'},

    # Metals
    'GOLD - COMMODITY EXCHANGE INC.': {'symbol': 'XAU', 'name': 'Gold', 'sector': 'METALS'},
    'SILVER - COMMODITY EXCHANGE INC.': {'symbol': 'XAG', 'name': 'Silver', 'sector': 'METALS'},
    'COPPER-GRADE #1 - COMMODITY EXCHANGE INC.': {'symbol': 'COPPER', 'name': 'Copper', 'sector': 'METALS'},
    'COPPER- #1 - COMMODITY EXCHANGE INC.': {'symbol': 'COPPER', 'name': 'Copper', 'sector': 'METALS'},
    'PLATINUM - NEW YORK MERCANTILE EXCHANGE': {'symbol': 'PLATINUM', 'name': 'Platinum', 'sector': 'METALS'},
    'PALLADIUM - NEW YORK MERCANTILE EXCHANGE': {'symbol': 'PALLADIUM', 'name': 'Palladium', 'sector': 'METALS'},

    # Commodities
    'CRUDE OIL, LIGHT SWEET - NEW YORK MERCANTILE EXCHANGE': {'symbol': 'WTI', 'name': 'Crude Oil', 'sector': 'COMMODITIES'},
    'CRUDE OIL, LIGHT SWEET-WTI - ICE FUTURES EUROPE': {'symbol': 'WTI', 'name': 'Crude Oil', 'sector': 'COMMODITIES'},
    'NAT GAS NYME - NEW YORK MERCANTILE EXCHANGE': {'symbol': 'NATGAS', 'name': 'Natural Gas', 'sector': 'COMMODITIES'},
    'HENRY HUB - NEW YORK MERCANTILE EXCHANGE': {'symbol': 'NATGAS', 'name': 'Natural Gas', 'sector': 'COMMODITIES'},
    'COFFEE C - ICE FUTURES U.S.': {'symbol': 'COFFEE', 'name': 'Coffee', 'sector': 'COMMODITIES'},
    'COCOA - ICE FUTURES U.S.': {'symbol': 'COCOA', 'name': 'Cocoa', 'sector': 'COMMODITIES'},
    'SUGAR NO. 11 - ICE FUTURES U.S.': {'symbol': 'SUGAR', 'name': 'Sugar', 'sector': 'COMMODITIES'},
    'WHEAT-SRW - CHICAGO BOARD OF TRADE': {'symbol': 'WHEAT', 'name': 'Wheat', 'sector': 'COMMODITIES'},
    'WHEAT - CHICAGO BOARD OF TRADE': {'symbol': 'WHEAT', 'name': 'Wheat', 'sector': 'COMMODITIES'},

    # Crypto
    'BITCOIN - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'BTC', 'name': 'Bitcoin', 'sector': 'CRYPTO'},
    'ETHER CASH SETTLED - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'ETH', 'name': 'Ethereum', 'sector': 'CRYPTO'},
    'ETHEREUM - CHICAGO MERCANTILE EXCHANGE': {'symbol': 'ETH', 'name': 'Ethereum', 'sector': 'CRYPTO'},
}

NORMALIZED_ASSET_MAP = {normalize_market_name(k): v for k, v in ASSET_MAP.items()}


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def to_float(value):
    try:
        if value is None:
            return 0.0
        raw = str(value).replace(',', '').strip()
        if raw in ('', '.', 'nan', 'None'):
            return 0.0
        return float(raw)
    except Exception:
        return 0.0


def lookup_asset(market: str):
    market = str(market).strip().strip('"')

    if 'ICE FUTURES EUROPE' in market.upper():
        return None

    normalized = normalize_market_name(market)
    for key, asset in ASSET_MAP.items():
        if normalize_market_name(key) == normalized:
            return asset

    return None


def parse_report_date(value):
    raw = str(value).strip()
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%Y%m%d'):
        try:
            return datetime.strptime(raw, fmt).date()
        except Exception:
            continue
    return None


def pct_of_oi(net_value, open_interest):
    if open_interest in (None, 0) or pd.isna(open_interest):
        return None
    try:
        return round((float(net_value) / float(open_interest)) * 100.0, 2)
    except Exception:
        return None


def classify_flow_state(index_value):
    """
    Classify flow state based on COT Index (Min-Max, 0-100 scale).
    Matches Excel thresholds typically used for COT analysis.
    """
    if pd.isna(index_value) or index_value is None:
        return None
    v = float(index_value)
    if v >= 90:
        return 'Long Extreme'
    if v <= 10:
        return 'Short Extreme'
    if v >= 65:
        return 'Accumulation'
    if v <= 35:
        return 'Distribution'
    return 'Neutral'


def init_db():
    log('Initializing DB schema...')
    with engine.begin() as conn:
        conn.execute(text('''
        CREATE TABLE IF NOT EXISTS cot_analytics (
            id SERIAL PRIMARY KEY,
            report_date DATE NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            name VARCHAR(120),
            sector VARCHAR(20),
            source_type VARCHAR(20),
            open_interest FLOAT,

            dealer_intermediary_long FLOAT,
            dealer_intermediary_short FLOAT,
            dealer_intermediary_net FLOAT,
            dealer_intermediary_pct_oi FLOAT,
            dealer_intermediary_percentile_3y FLOAT,

            asset_manager_long FLOAT,
            asset_manager_short FLOAT,
            asset_manager_net FLOAT,
            asset_manager_pct_oi FLOAT,
            asset_manager_percentile_3y FLOAT,

            leveraged_funds_long FLOAT,
            leveraged_funds_short FLOAT,
            leveraged_funds_net FLOAT,
            leveraged_funds_pct_oi FLOAT,
            leveraged_funds_percentile_3y FLOAT,

            producer_merchant_long FLOAT,
            producer_merchant_short FLOAT,
            producer_merchant_net FLOAT,
            producer_merchant_pct_oi FLOAT,
            producer_merchant_percentile_3y FLOAT,

            swap_dealers_long FLOAT,
            swap_dealers_short FLOAT,
            swap_dealers_net FLOAT,
            swap_dealers_pct_oi FLOAT,
            swap_dealers_percentile_3y FLOAT,

            managed_money_long FLOAT,
            managed_money_short FLOAT,
            managed_money_net FLOAT,
            managed_money_pct_oi FLOAT,
            managed_money_percentile_3y FLOAT,

            other_reportables_long FLOAT,
            other_reportables_short FLOAT,
            other_reportables_net FLOAT,
            other_reportables_pct_oi FLOAT,
            other_reportables_percentile_3y FLOAT,

            flow_state VARCHAR(50),
            UNIQUE(report_date, symbol, source_type)
        );
        '''))


def parse_tff_row(row):
    market = str(row[0]).strip().strip('"')
    asset = lookup_asset(market)
    if asset is None:
        return None

    report_date = parse_report_date(row[2])
    if report_date is None:
        return None

    oi = to_float(row[7])

    dealer_long = to_float(row[8])
    dealer_short = to_float(row[9])

    asset_manager_long = to_float(row[11])
    asset_manager_short = to_float(row[12])

    leveraged_long = to_float(row[14])
    leveraged_short = to_float(row[15])

    other_long = to_float(row[17])
    other_short = to_float(row[18])

    dealer_net = dealer_long - dealer_short
    asset_manager_net = asset_manager_long - asset_manager_short
    leveraged_net = leveraged_long - leveraged_short
    other_net = other_long - other_short

    return {
        'report_date': report_date,
        'symbol': asset['symbol'],
        'name': asset['name'],
        'sector': asset['sector'],
        'source_type': 'TFF',
        'open_interest': oi,

        'dealer_intermediary_long': dealer_long,
        'dealer_intermediary_short': dealer_short,
        'dealer_intermediary_net': dealer_net,
        'dealer_intermediary_pct_oi': pct_of_oi(dealer_net, oi),

        'asset_manager_long': asset_manager_long,
        'asset_manager_short': asset_manager_short,
        'asset_manager_net': asset_manager_net,
        'asset_manager_pct_oi': pct_of_oi(asset_manager_net, oi),

        'leveraged_funds_long': leveraged_long,
        'leveraged_funds_short': leveraged_short,
        'leveraged_funds_net': leveraged_net,
        'leveraged_funds_pct_oi': pct_of_oi(leveraged_net, oi),

        'producer_merchant_long': None,
        'producer_merchant_short': None,
        'producer_merchant_net': None,
        'producer_merchant_pct_oi': None,

        'swap_dealers_long': None,
        'swap_dealers_short': None,
        'swap_dealers_net': None,
        'swap_dealers_pct_oi': None,

        'managed_money_long': None,
        'managed_money_short': None,
        'managed_money_net': None,
        'managed_money_pct_oi': None,
    }


def parse_disagg_row(row):
    market = str(row[0]).strip().strip('"')
    asset = lookup_asset(market)
    if asset is None:
        return None

    report_date = parse_report_date(row[2])
    if report_date is None:
        return None

    oi = to_float(row[7])

    producer_long = to_float(row[8])
    producer_short = to_float(row[9])
    swap_long = to_float(row[10])
    swap_short = to_float(row[11])
    managed_long = to_float(row[13])
    managed_short = to_float(row[14])

    producer_net = producer_long - producer_short
    swap_net = swap_long - swap_short
    managed_net = managed_long - managed_short

    return {
        'report_date': report_date,
        'symbol': asset['symbol'],
        'name': asset['name'],
        'sector': asset['sector'],
        'source_type': 'DISAGG',
        'open_interest': oi,

        'dealer_intermediary_long': None,
        'dealer_intermediary_short': None,
        'dealer_intermediary_net': None,
        'dealer_intermediary_pct_oi': None,

        'asset_manager_long': None,
        'asset_manager_short': None,
        'asset_manager_net': None,
        'asset_manager_pct_oi': None,

        'leveraged_funds_long': None,
        'leveraged_funds_short': None,
        'leveraged_funds_net': None,
        'leveraged_funds_pct_oi': None,

        'producer_merchant_long': producer_long,
        'producer_merchant_short': producer_short,
        'producer_merchant_net': producer_net,
        'producer_merchant_pct_oi': pct_of_oi(producer_net, oi),

        'swap_dealers_long': swap_long,
        'swap_dealers_short': swap_short,
        'swap_dealers_net': swap_net,
        'swap_dealers_pct_oi': pct_of_oi(swap_net, oi),

        'managed_money_long': managed_long,
        'managed_money_short': managed_short,
        'managed_money_net': managed_net,
        'managed_money_pct_oi': pct_of_oi(managed_net, oi),
    }


def parse_cftc_text(raw_text, source_type):
    rows = []
    unmatched = set()

    reader = csv.reader(io.StringIO(raw_text), skipinitialspace=True)

    for row in reader:
        if len(row) < 16:
            continue

        try:
            market = str(row[0]).strip().strip('"')
            asset = lookup_asset(market)
            if asset is None:
                unmatched.add(market)
                continue

            parsed = parse_tff_row(row) if source_type == 'TFF' else parse_disagg_row(row)
            if parsed:
                rows.append(parsed)
        except Exception:
            continue

    if unmatched:
        log(f'{source_type} unmatched markets count: {len(unmatched)}')
        log(f'{source_type} unmatched markets sample: {sorted(unmatched)[:25]}')

    return pd.DataFrame(rows)


def download_and_parse(url, source_type):
    log(f'Downloading {source_type} data from {url}')
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=60)
    response.raise_for_status()

    df = parse_cftc_text(response.text, source_type)
    if not df.empty:
        log(f"{source_type} extracted rows: {len(df)}")
        log(f"{source_type} matched symbols: {sorted(df['symbol'].dropna().unique().tolist())}")

    return df


def download_zip_and_parse(url, source_type, year):
    log(f'Downloading historical {source_type} data for {year} from {url}')
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=120)
    response.raise_for_status()

    zf = zipfile.ZipFile(io.BytesIO(response.content))
    members = [n for n in zf.namelist() if n.lower().endswith(('.txt', '.csv'))]
    if not members:
        return pd.DataFrame()

    with zf.open(members[0]) as f:
        raw_text = f.read().decode('utf-8', errors='ignore')

    df = parse_cftc_text(raw_text, source_type)
    log(f'Historical {source_type} {year}: extracted {len(df)} relevant rows')
    return df


# ─────────────────────────────────────────────────────────────────────────────
# COT INDEX — Min-Max normalization, rolling 156 weeks (≈ 3 years)
#
# Replicates the Excel formula exactly:
#   =IFERROR(
#     (current - MIN(last 156 rows)) /
#     (MAX(last 156 rows) - MIN(last 156 rows)),
#     NA()
#   )
#
# Result: 0–100 scale (0 = 3y low, 100 = 3y high)
# ─────────────────────────────────────────────────────────────────────────────
def compute_cot_index(series: pd.Series, window: int = 156, min_periods: int = 20) -> pd.Series:
    """
    Rolling Min-Max COT Index — matches Excel OFFSET-based formula.
    Returns values in 0-100 range. Returns NaN when range == 0 or insufficient data.
    """
    rolling = series.rolling(window=window, min_periods=min_periods)
    rolling_min = rolling.min()
    rolling_max = rolling.max()
    rolling_range = rolling_max - rolling_min

    # Avoid division by zero (flat series → NaN, not 0)
    index = (series - rolling_min) / rolling_range.replace(0.0, float('nan'))
    return (index * 100).round(2)


def compute_percentiles(df: pd.DataFrame, column_name: str, index_col_name: str) -> pd.DataFrame:
    """
    Compute rolling COT Index (Min-Max) per symbol, sorted by date.
    The result column name is kept as *_percentile_3y for backward compatibility
    with all existing API routes and frontend logic.
    """
    valid_mask = df[column_name].notna()

    results = (
        df.loc[valid_mask]
        .groupby('symbol', group_keys=False)[column_name]
        .transform(lambda s: compute_cot_index(s))
    )

    df.loc[valid_mask, index_col_name] = results
    return df


def compute_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    log('Computing rolling COT Index (Min-Max, 156w) and flow state...')
    df = df.copy()
    df['report_date'] = pd.to_datetime(df['report_date'])
    # Must be sorted per symbol by date for rolling to work correctly
    df = df.sort_values(['symbol', 'source_type', 'report_date']).reset_index(drop=True)

    percentile_pairs = [
        ('dealer_intermediary_net',  'dealer_intermediary_percentile_3y'),
        ('asset_manager_net',        'asset_manager_percentile_3y'),
        ('leveraged_funds_net',      'leveraged_funds_percentile_3y'),
        ('producer_merchant_net',    'producer_merchant_percentile_3y'),
        ('swap_dealers_net',         'swap_dealers_percentile_3y'),
        ('managed_money_net',        'managed_money_percentile_3y'),
    ]

    for net_col, idx_col in percentile_pairs:
        if net_col in df.columns:
            df[idx_col] = float('nan')
            df = compute_percentiles(df, net_col, idx_col)

    # Primary flow driver: leveraged funds (TFF) or managed money (DISAGG)
    df['flow_driver_index'] = df.apply(
        lambda row: row['leveraged_funds_percentile_3y']
        if row.get('source_type') == 'TFF'
        else row['managed_money_percentile_3y'],
        axis=1,
    )

    df['flow_state'] = df['flow_driver_index'].apply(classify_flow_state)
    df['report_date'] = df['report_date'].dt.date
    return df


def load_existing_history():
    log('Loading existing history from DB...')
    try:
        return pd.read_sql('SELECT * FROM cot_analytics', engine)
    except Exception as e:
        log(f'Could not load existing history from DB: {e}')
        return pd.DataFrame()


def upsert_to_db(df: pd.DataFrame):
    if df.empty:
        log('No rows to upsert.')
        return

    df = df.drop_duplicates(subset=['report_date', 'symbol', 'source_type'], keep='last').copy()
    log(f'Upserting {len(df)} records to database...')

    sql = text('''
    INSERT INTO cot_analytics (
        report_date, symbol, name, sector, source_type, open_interest,
        dealer_intermediary_long, dealer_intermediary_short, dealer_intermediary_net,
            dealer_intermediary_pct_oi, dealer_intermediary_percentile_3y,
        asset_manager_long, asset_manager_short, asset_manager_net,
            asset_manager_pct_oi, asset_manager_percentile_3y,
        leveraged_funds_long, leveraged_funds_short, leveraged_funds_net,
            leveraged_funds_pct_oi, leveraged_funds_percentile_3y,
        producer_merchant_long, producer_merchant_short, producer_merchant_net,
            producer_merchant_pct_oi, producer_merchant_percentile_3y,
        swap_dealers_long, swap_dealers_short, swap_dealers_net,
            swap_dealers_pct_oi, swap_dealers_percentile_3y,
        managed_money_long, managed_money_short, managed_money_net,
            managed_money_pct_oi, managed_money_percentile_3y,
        flow_state
    ) VALUES (
        :report_date, :symbol, :name, :sector, :source_type, :open_interest,
        :dealer_intermediary_long, :dealer_intermediary_short, :dealer_intermediary_net,
            :dealer_intermediary_pct_oi, :dealer_intermediary_percentile_3y,
        :asset_manager_long, :asset_manager_short, :asset_manager_net,
            :asset_manager_pct_oi, :asset_manager_percentile_3y,
        :leveraged_funds_long, :leveraged_funds_short, :leveraged_funds_net,
            :leveraged_funds_pct_oi, :leveraged_funds_percentile_3y,
        :producer_merchant_long, :producer_merchant_short, :producer_merchant_net,
            :producer_merchant_pct_oi, :producer_merchant_percentile_3y,
        :swap_dealers_long, :swap_dealers_short, :swap_dealers_net,
            :swap_dealers_pct_oi, :swap_dealers_percentile_3y,
        :managed_money_long, :managed_money_short, :managed_money_net,
            :managed_money_pct_oi, :managed_money_percentile_3y,
        :flow_state
    )
    ON CONFLICT (report_date, symbol, source_type) DO UPDATE SET
        name                            = EXCLUDED.name,
        sector                          = EXCLUDED.sector,
        open_interest                   = EXCLUDED.open_interest,
        dealer_intermediary_long        = EXCLUDED.dealer_intermediary_long,
        dealer_intermediary_short       = EXCLUDED.dealer_intermediary_short,
        dealer_intermediary_net         = EXCLUDED.dealer_intermediary_net,
        dealer_intermediary_pct_oi      = EXCLUDED.dealer_intermediary_pct_oi,
        dealer_intermediary_percentile_3y = EXCLUDED.dealer_intermediary_percentile_3y,
        asset_manager_long              = EXCLUDED.asset_manager_long,
        asset_manager_short             = EXCLUDED.asset_manager_short,
        asset_manager_net               = EXCLUDED.asset_manager_net,
        asset_manager_pct_oi            = EXCLUDED.asset_manager_pct_oi,
        asset_manager_percentile_3y     = EXCLUDED.asset_manager_percentile_3y,
        leveraged_funds_long            = EXCLUDED.leveraged_funds_long,
        leveraged_funds_short           = EXCLUDED.leveraged_funds_short,
        leveraged_funds_net             = EXCLUDED.leveraged_funds_net,
        leveraged_funds_pct_oi          = EXCLUDED.leveraged_funds_pct_oi,
        leveraged_funds_percentile_3y   = EXCLUDED.leveraged_funds_percentile_3y,
        producer_merchant_long          = EXCLUDED.producer_merchant_long,
        producer_merchant_short         = EXCLUDED.producer_merchant_short,
        producer_merchant_net           = EXCLUDED.producer_merchant_net,
        producer_merchant_pct_oi        = EXCLUDED.producer_merchant_pct_oi,
        producer_merchant_percentile_3y = EXCLUDED.producer_merchant_percentile_3y,
        swap_dealers_long               = EXCLUDED.swap_dealers_long,
        swap_dealers_short              = EXCLUDED.swap_dealers_short,
        swap_dealers_net                = EXCLUDED.swap_dealers_net,
        swap_dealers_pct_oi             = EXCLUDED.swap_dealers_pct_oi,
        swap_dealers_percentile_3y      = EXCLUDED.swap_dealers_percentile_3y,
        managed_money_long              = EXCLUDED.managed_money_long,
        managed_money_short             = EXCLUDED.managed_money_short,
        managed_money_net               = EXCLUDED.managed_money_net,
        managed_money_pct_oi            = EXCLUDED.managed_money_pct_oi,
        managed_money_percentile_3y     = EXCLUDED.managed_money_percentile_3y,
        flow_state                      = EXCLUDED.flow_state
    ''')

    def clean(v):
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
        except Exception:
            pass
        return v

    with engine.begin() as conn:
        for _, row in df.iterrows():
            payload = {k: clean(v) for k, v in row.to_dict().items()}
            payload.pop('flow_driver_index', None)
            payload.pop('id', None)
            conn.execute(sql, payload)

    log('DB Upsert complete.')


def bootstrap_history(start_year=2020, end_year=2026):
    log(f'=== BOOTSTRAP HISTORY {start_year}-{end_year} ===')
    init_db()

    frames = []
    for year in range(start_year, end_year + 1):
        if year in HISTORICAL_TFF_URLS:
            df_tff = download_zip_and_parse(HISTORICAL_TFF_URLS[year], 'TFF', year)
            if not df_tff.empty:
                frames.append(df_tff)

        if year in HISTORICAL_DISAGG_URLS:
            df_disagg = download_zip_and_parse(HISTORICAL_DISAGG_URLS[year], 'DISAGG', year)
            if not df_disagg.empty:
                frames.append(df_disagg)

    if not frames:
        log('No historical data loaded.')
        return

    combined = pd.concat(frames, ignore_index=True)
    combined = combined.drop_duplicates(subset=['report_date', 'symbol', 'source_type'], keep='last')
    log(f'Historical combined rows before metrics: {len(combined)}')

    final_df = compute_metrics(combined)
    upsert_to_db(final_df)

    log('=== HISTORY BOOTSTRAP COMPLETE ===')


def run_weekly_update():
    log('=== STARTING COT WEEKLY INCREMENTAL UPDATE ===')
    init_db()

    existing_df = load_existing_history()
    df_tff = download_and_parse(URL_TFF_WEEKLY, 'TFF')
    df_disagg = download_and_parse(URL_DISAGG_WEEKLY, 'DISAGG')

    frames = [df for df in [df_tff, df_disagg] if not df.empty]
    weekly_df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()

    if existing_df.empty:
        combined = weekly_df.copy()
    else:
        combined = pd.concat([existing_df, weekly_df], ignore_index=True)

    combined = combined.drop_duplicates(subset=['report_date', 'symbol', 'source_type'], keep='last')
    log(f'Combined rows for metric recomputation: {len(combined)}')

    final_df = compute_metrics(combined)

    latest_dates = pd.to_datetime(weekly_df['report_date']).dt.date.unique().tolist()
    final_df_new = final_df[final_df['report_date'].isin(latest_dates)].copy()

    upsert_to_db(final_df_new)
    log('=== WEEKLY UPDATE COMPLETE ===')


if __name__ == '__main__':
    mode = os.getenv('COT_MODE', 'weekly').lower()

    if mode == 'history':
        bootstrap_history(2016, 2026)
    else:
        run_weekly_update()