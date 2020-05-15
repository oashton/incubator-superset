from typing import Callable
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_babel import lazy_gettext as _
from flask import g
from flask_sqlalchemy import BaseQuery

from superset.constants import RouteMethod
import superset.models.core as models

from .base import BaseFilter, DeleteMixin, SupersetModelView

class UrlFilter(BaseFilter):  # pylint: disable=too-few-public-methods
    def apply(self, query: BaseQuery, value: Callable) -> BaseQuery:
        query = query.filter(models.Url.label != None,
                                models.Url.created_by_fk == g.user.get_user_id())
        return query

class UrlModelView(
    SupersetModelView, DeleteMixin
):  # pylint: disable=too-many-ancestors
    datamodel = SQLAInterface(models.Url)
    include_route_methods = {RouteMethod.SHOW, RouteMethod.LIST, RouteMethod.API_READ}

    list_title = _("List Bookmarks")
    show_title = _("Show Url")
    add_title = _("Add Url")
    edit_title = _("Edit Url")

    list_columns = ["bookmark_url",]

    base_filters = [["id", UrlFilter, lambda: []]]

    label_columns = {"bookmark_url": _("bookmark_url")}
