"""Streamlit app entry for Manga Auto Colorizer.

Placeholder interface spec. Codex should implement the full UI later.
"""
from pathlib import Path
import streamlit as st

PROJECT_ROOT = Path(r"D:\AIProjects\manga-auto-colorizer")

st.set_page_config(page_title="Manga Auto Colorizer", layout="wide")
st.title("Manga Auto Colorizer")
st.caption("Auto-only local manga colorization app.")

st.info("This app will call scripts/pipeline.py after Codex implements the backend scripts.")
st.subheader("Expected data flow")
st.code("input/pages_bw or input/pdf -> output/preprocessed -> output/colorized_raw -> output/colorized_fixed -> output/final_pdf")
