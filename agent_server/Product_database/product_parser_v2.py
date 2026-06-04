import pandas as pd
import json
import re

# === FILES ===
product_files = [
    "/home/chanman/Hackathon/Sales-proposal-generator/version-2/Product_database/Sales_guide.xlsx",
    "/home/chanman/Hackathon/Sales-proposal-generator/version-2/Product_database/pitch_acc.xlsx",
    "/home/chanman/Hackathon/Sales-proposal-generator/version-2/Product_database/IPVS Products Sheet.xlsx",
]

price_file = "/home/chanman/Hackathon/Sales-proposal-generator/Product_database/Unit_price_sheet.xlsx"


# === HELPERS ===
def normalize_columns(df):
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
    )
    return df

def normalize_text(text):
    if pd.isna(text):
        return ""
    return re.sub(r'[^a-z0-9]', '', str(text).lower())

def extract_features(text):
    if pd.isna(text):
        return []
    parts = re.split(r'[,\n•\-]+', str(text))
    return [p.strip() for p in parts if len(p.strip()) > 3]


# === BUILD PRICE LOOKUP ===
def build_price_lookup(price_file):
    price_df = pd.read_excel(price_file)
    price_df = normalize_columns(price_df)

    lookup = {}

    for _, row in price_df.iterrows():
        row_dict = row.to_dict()

        # Try multiple keys
        keys = [
            row_dict.get("product_id"),
            row_dict.get("sku"),
            row_dict.get("product_name"),
            row_dict.get("name")
        ]

        price = None
        for k in ["price", "unit_price", "mrp", "cost"]:
            if k in row_dict and pd.notna(row_dict[k]):
                try:
                    price = float(row_dict[k])
                    break
                except:
                    pass

        if price is None:
            continue

        for key in keys:
            if pd.notna(key):
                lookup[normalize_text(key)] = price

    return lookup


# === PRODUCT BUILDER ===
def build_product(row, file_name, sheet_name, idx, price_lookup):
    row_dict = row.to_dict()

    product_name = str(
        row_dict.get("product_name") or 
        row_dict.get("name") or 
        f"product_{idx}"
    )

    product_id = str(
        row_dict.get("product_id") or 
        row_dict.get("sku") or 
        f"{file_name[:3]}-{idx:04d}"
    )

    # ---- PRICE MATCHING ----
    price = None
    keys_to_match = [
        product_id,
        product_name,
        row_dict.get("sku")
    ]

    for key in keys_to_match:
        if key:
            normalized = normalize_text(key)
            if normalized in price_lookup:
                price = price_lookup[normalized]
                break

    # ---- ATTRIBUTES ----
    attributes = {}
    raw_text_parts = []

    for key, value in row_dict.items():
        if pd.notna(value):
            attributes[key] = value
            raw_text_parts.append(f"{key}: {value}")

    # ---- FEATURES ----
    features = []
    for key in row_dict:
        if "feature" in key or "description" in key or "spec" in key:
            features.extend(extract_features(row_dict[key]))

    # ---- PRODUCT OBJECT ----
    return {
        "product_id": product_id,
        "product_name": product_name,

        "category": row_dict.get("category", "general"),
        "subcategory": row_dict.get("subcategory", "misc"),

        "pricing": {
            "unit_price": price,
            "currency": "INR",
            "price_source": "unit_price_sheet" if price else "unknown"
        },

        "attributes": attributes,
        "features": list(set(features)),

        "raw_text": " | ".join(raw_text_parts),

        "source": {
            "file": file_name,
            "sheet": sheet_name,
            "row_index": idx
        }
    }


# === MAIN ===
price_lookup = build_price_lookup(price_file)

all_products = []
seen_ids = set()

for file in product_files:
    sheets = pd.read_excel(file, sheet_name=None)

    for sheet_name, df in sheets.items():
        df = normalize_columns(df)

        for idx, row in df.iterrows():
            product = build_product(row, file, sheet_name, idx, price_lookup)

            if product["product_id"] not in seen_ids:
                seen_ids.add(product["product_id"])
                all_products.append(product)

# === SAVE ===
with open("products_catalog.json", "w") as f:
    json.dump(all_products, f, indent=2)

print(f"Generated {len(all_products)} products")