from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

# declare engine
engine = create_engine("sqlite:///./db/database.db")

# declare base class for defining data models
base = declarative_base()