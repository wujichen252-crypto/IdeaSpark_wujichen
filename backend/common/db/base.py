"""
Custom MySQL database backend that bypasses the MySQL 8 version check.
Django 4.2+ requires MySQL 8.0+, but our production DB runs MySQL 5.7.
"""
from django.db.backends.mysql.base import DatabaseWrapper as BaseDatabaseWrapper
from django.db.backends.mysql.base import DatabaseFeatures as BaseDatabaseFeatures
from django.db.backends.mysql.base import DatabaseOperations as BaseDatabaseOperations
from django.db.backends.mysql.base import DatabaseClient, DatabaseCreation, DatabaseIntrospection


class DatabaseFeatures(BaseDatabaseFeatures):
    """Override to skip MySQL version check."""

    def minimum_database_version(self):
        return (5, 7, 0)


class DatabaseWrapper(BaseDatabaseWrapper):
    """Wrapper that allows MySQL 5.7."""

    class MySQLDatabaseFeatures(BaseDatabaseFeatures):
        def minimum_database_version(self):
            return (5, 7, 0)

    def get_new_connection(self, conn_params):
        return super().get_new_connection(conn_params)
