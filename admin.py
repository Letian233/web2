"""
Flask-Admin 后台管理系统配置模块

功能：
- 提供可视化的数据库管理界面
- 支持对所有数据表进行 CRUD 操作
- 仅限管理员用户访问
"""

from flask import redirect, url_for, session, flash, render_template
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView

from auth import (
    engine,
    SessionLocal,
    User,
    MenuItem,
    Review,
    ReviewLike,
    Order,
    OrderItem,
    Address,
    AboutContent,
)


# ==================== 自定义基础视图类 ====================

class SecureAdminIndexView(AdminIndexView):
    """
    自定义管理首页视图，添加权限验证。
    只有 is_admin=True 的用户才能访问后台。
    """

    @expose('/')
    def index(self):
        # Check if user is logged in and is admin
        if not session.get('user_id') or not session.get('is_admin'):
            flash('You do not have permission to access the admin panel.', 'error')
            return redirect(url_for('login'))
        
        # Get statistics
        db = SessionLocal()
        try:
            from auth import User, MenuItem, Order, Review, AboutContent
            
            stats = {
                'total_users': db.query(User).count(),
                'total_menu_items': db.query(MenuItem).count(),
                'total_orders': db.query(Order).count(),
                'total_reviews': db.query(Review).count(),
                'total_content': db.query(AboutContent).count(),
            }
        except Exception as e:
            stats = {
                'total_users': 0,
                'total_menu_items': 0,
                'total_orders': 0,
                'total_reviews': 0,
                'total_content': 0,
            }
        finally:
            db.close()
        
        # Render custom index page
        # 使用 self.render() 方法，它会自动处理 Flask-Admin 的上下文变量
        # 模板继承自 admin/master.html，导航栏会自动与 Flask-Admin 的其他页面保持一致
        return self.render('admin/index.html', stats=stats)


class SecureModelView(ModelView):
    """
    自定义模型视图基类，添加权限验证。
    所有继承此类的模型视图都需要管理员权限。
    """

    def is_accessible(self):
        """Check if current user has permission to access"""
        return session.get('user_id') and session.get('is_admin')

    def inaccessible_callback(self, name, **kwargs):
        """Callback when user doesn't have permission"""
        flash('You do not have permission to access this page.', 'error')
        return redirect(url_for('login'))


# ==================== 各模型的管理视图 ====================

class UserModelView(SecureModelView):
    """User Management View"""
    
    # Columns to display in list view
    column_list = ['id', 'username', 'email', 'is_admin', 'phone', 'avatar_url']
    
    # Searchable columns
    column_searchable_list = ['username', 'email', 'phone']
    
    # Filterable columns
    column_filters = ['is_admin']
    
    # Excluded columns from form (password should not be edited directly)
    form_excluded_columns = ['password_hash']
    
    # Column display labels
    column_labels = {
        'id': 'ID',
        'username': 'Username',
        'email': 'Email',
        'is_admin': 'Admin',
        'phone': 'Phone',
        'avatar_url': 'Avatar URL',
    }
    
    # Items per page
    page_size = 20


class MenuItemModelView(SecureModelView):
    """Menu Item Management View"""
    
    column_list = ['id', 'name', 'price', 'category', 'rating', 'description']
    column_searchable_list = ['name', 'category', 'description']
    column_filters = ['category', 'rating']
    
    column_labels = {
        'id': 'ID',
        'name': 'Item Name',
        'price': 'Price',
        'description': 'Description',
        'image_url': 'Image URL',
        'category': 'Category',
        'rating': 'Rating',
    }
    
    # Format price display
    column_formatters = {
        'price': lambda v, c, m, p: f'${m.price:.2f}' if m.price else '-',
    }
    
    page_size = 20


class ReviewModelView(SecureModelView):
    """Review Management View"""
    
    column_list = ['id', 'user_id', 'content', 'date', 'likes_count', 'parent_id']
    column_searchable_list = ['content']
    column_filters = ['user_id', 'date', 'likes_count']
    
    column_labels = {
        'id': 'ID',
        'user_id': 'User ID',
        'content': 'Content',
        'date': 'Date',
        'likes_count': 'Likes',
        'parent_id': 'Parent Review ID',
    }
    
    page_size = 20


class ReviewLikeModelView(SecureModelView):
    """Review Like Management View"""
    
    column_list = ['user_id', 'review_id', 'created_at']
    column_filters = ['user_id', 'review_id']
    
    column_labels = {
        'user_id': 'User ID',
        'review_id': 'Review ID',
        'created_at': 'Liked At',
    }
    
    page_size = 20


class OrderModelView(SecureModelView):
    """Order Management View"""
    
    column_list = ['id', 'user_id', 'date', 'total_amount', 'status']
    column_searchable_list = ['status']
    column_filters = ['user_id', 'status', 'date']
    
    column_labels = {
        'id': 'Order ID',
        'user_id': 'User ID',
        'date': 'Order Date',
        'total_amount': 'Total Amount',
        'status': 'Status',
    }
    
    column_formatters = {
        'total_amount': lambda v, c, m, p: f'${m.total_amount:.2f}' if m.total_amount else '-',
    }
    
    page_size = 20


class OrderItemModelView(SecureModelView):
    """Order Item Management View"""
    
    column_list = ['order_id', 'menu_item_id', 'quantity', 'price_at_purchase']
    column_filters = ['order_id', 'menu_item_id']
    
    column_labels = {
        'order_id': 'Order ID',
        'menu_item_id': 'Menu Item ID',
        'quantity': 'Quantity',
        'price_at_purchase': 'Price at Purchase',
    }
    
    column_formatters = {
        'price_at_purchase': lambda v, c, m, p: f'${m.price_at_purchase:.2f}' if m.price_at_purchase else '-',
    }
    
    page_size = 20


class AddressModelView(SecureModelView):
    """Address Management View"""
    
    column_list = ['id', 'user_id', 'title', 'recipient_name', 'phone', 'city', 'is_default']
    column_searchable_list = ['recipient_name', 'phone', 'city', 'address_line']
    column_filters = ['user_id', 'city', 'is_default']
    
    column_labels = {
        'id': 'ID',
        'user_id': 'User ID',
        'title': 'Address Title',
        'recipient_name': 'Recipient Name',
        'phone': 'Phone',
        'address_line': 'Address Line',
        'city': 'City',
        'state': 'State/Province',
        'zip_code': 'Zip Code',
        'is_default': 'Default Address',
    }
    
    page_size = 20


class AboutContentModelView(SecureModelView):
    """About Page Content Management View"""
    
    column_list = ['id', 'section_name', 'title', 'updated_at']
    column_searchable_list = ['section_name', 'title', 'content']
    column_filters = ['section_name']
    
    column_labels = {
        'id': 'ID',
        'section_name': 'Section Name',
        'title': 'Title',
        'content': 'Content',
        'image_url': 'Image URL',
        'updated_at': 'Updated At',
    }
    
    # Use textarea for content field
    form_widget_args = {
        'content': {'rows': 10},
    }
    
    page_size = 20


# ==================== 初始化 Admin ====================

def init_admin(app):
    """
    Initialize Flask-Admin and register all model views.
    
    Args:
        app: Flask application instance
    """
    # Create database session
    db_session = SessionLocal()
    
    # Create Admin instance
    # 注意：某些 Flask-Admin 版本不支持 template_mode 和 base_template 参数
    admin = Admin(
        app,
        name='Restaurant Admin Panel',
        index_view=SecureAdminIndexView(
            name='Home',
            url='/admin'
        ),
    )
    
    # Register all model views
    admin.add_view(UserModelView(User, db_session, name='Users', category='Users'))
    admin.add_view(AddressModelView(Address, db_session, name='Addresses', category='Users'))
    
    admin.add_view(MenuItemModelView(MenuItem, db_session, name='Menu Items', category='Menu'))
    
    admin.add_view(OrderModelView(Order, db_session, name='Orders', category='Orders'))
    admin.add_view(OrderItemModelView(OrderItem, db_session, name='Order Items', category='Orders'))
    
    admin.add_view(ReviewModelView(Review, db_session, name='Reviews', category='Reviews'))
    admin.add_view(ReviewLikeModelView(ReviewLike, db_session, name='Review Likes', category='Reviews'))
    
    admin.add_view(AboutContentModelView(AboutContent, db_session, name='About Content', category='Content'))
    
    return admin

