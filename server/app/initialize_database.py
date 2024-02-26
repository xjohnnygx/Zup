if __name__ == "__main__":

    from db.properties import engine, base
    from db.models import *

    base.metadata.create_all(engine)