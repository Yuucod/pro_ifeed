# Permite usar MySQL com PyMySQL quando DB_ENGINE=mysql estiver no .env.
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except Exception:
    pass
