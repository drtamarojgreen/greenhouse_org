"""
Analytics handler for comprehensive dashboard metrics and reporting
"""
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from ..database import get_db
from ..utils.audit_logger import audit_log, audit_logger

analytics_bp = Blueprint('analytics_bp', __name__)


@analytics_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
@audit_log('VIEW', 'analytics_dashboard')
def get_dashboard_metrics():
    """
    Get comprehensive dashboard metrics
    
    Query params:
        - time_range: 'day', 'week', 'month', 'year' (default: 'month')
    
    Returns:
        Dashboard metrics including patient stats, appointments, assessments, etc.
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    time_range = request.args.get('time_range', 'month')
    
    # Calculate date range
    end_date = datetime.now()
    if time_range == 'day':
        start_date = end_date - timedelta(days=1)
    elif time_range == 'week':
        start_date = end_date - timedelta(weeks=1)
    elif time_range == 'year':
        start_date = end_date - timedelta(days=365)
    else:  # month
        start_date = end_date - timedelta(days=30)
    
    db = get_db()
    cur = db.cursor()
    
    try:
        metrics = {}
        
        # Patient Overview Metrics
        if role in ['admin', 'clinician']:
            # Total patients
            cur.execute('SELECT COUNT(*) FROM patients')
            metrics['total_patients'] = cur.fetchone()[0]
            
            # New patients in time range
            cur.execute(
                'SELECT COUNT(*) FROM patients WHERE created_at >= %s',
                (start_date,)
            )
            metrics['new_patients'] = cur.fetchone()[0]
            
            # Active patients (with recent activity)
            cur.execute(
                """
                SELECT COUNT(DISTINCT patient_id) 
                FROM appointments 
                WHERE appointment_time >= %s
                """,
                (start_date,)
            )
            metrics['active_patients'] = cur.fetchone()[0]
        
        # Appointment Metrics
        if role in ['admin', 'clinician']:
            # Total appointments
            cur.execute(
                """
                SELECT COUNT(*), status
                FROM appointments
                WHERE appointment_time >= %s
                GROUP BY status
                """,
                (start_date,)
            )
            appointment_stats = cur.fetchall()
            metrics['appointments'] = {
                'total': sum(row[0] for row in appointment_stats),
                'by_status': {row[1]: row[0] for row in appointment_stats}
            }
            
            # Upcoming appointments
            cur.execute(
                """
                SELECT COUNT(*)
                FROM appointments
                WHERE appointment_time > %s AND status = 'scheduled'
                """,
                (datetime.now(),)
            )
            metrics['upcoming_appointments'] = cur.fetchone()[0]
        
        # Assessment Metrics
        if role in ['admin', 'clinician']:
            # Assessment completion rate
            cur.execute(
                """
                SELECT 
                    si.instrument_code,
                    si.name,
                    COUNT(*) as total_assessments,
                    AVG(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) as completion_rate
                FROM scale_instruments si
                LEFT JOIN psyconnect p ON p.assessment_type = si.instrument_code
                    AND p.assessed_at >= %s
                WHERE si.active = true
                GROUP BY si.instrument_code, si.name
                """,
                (start_date,)
            )
            assessment_stats = cur.fetchall()
            metrics['assessments'] = [
                {
                    'instrument_code': row[0],
                    'name': row[1],
                    'total': row[2],
                    'completion_rate': float(row[3]) if row[3] else 0
                }
                for row in assessment_stats
            ]
        
        # Therapy Session Metrics
        if role in ['admin', 'clinician']:
            # Total sessions
            cur.execute(
                """
                SELECT COUNT(*), AVG(duration_minutes)
                FROM therapy_sessions ts
                JOIN appointments a ON a.id = ts.appointment_id
                WHERE a.appointment_time >= %s
                """,
                (start_date,)
            )
            session_data = cur.fetchone()
            metrics['therapy_sessions'] = {
                'total': session_data[0],
                'avg_duration': float(session_data[1]) if session_data[1] else 0
            }
            
            # Homework completion rate
            cur.execute(
                """
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed
                FROM therapy_homework
                WHERE assigned_at >= %s
                """,
                (start_date,)
            )
            homework_data = cur.fetchone()
            total_hw = homework_data[0] or 0
            completed_hw = homework_data[1] or 0
            metrics['homework_completion_rate'] = (completed_hw / total_hw * 100) if total_hw > 0 else 0
        
        # Vitals Metrics
        if role in ['admin', 'clinician']:
            # Average vitals
            cur.execute(
                """
                SELECT 
                    AVG(heart_rate) as avg_hr,
                    COUNT(*) as total_readings
                FROM vitals
                WHERE recorded_at >= %s AND heart_rate IS NOT NULL
                """,
                (start_date,)
            )
            vitals_data = cur.fetchone()
            metrics['vitals'] = {
                'avg_heart_rate': float(vitals_data[0]) if vitals_data[0] else 0,
                'total_readings': vitals_data[1]
            }
        
        # Messaging Metrics
        if role in ['admin', 'clinician']:
            # Message volume
            cur.execute(
                """
                SELECT COUNT(*)
                FROM messages
                WHERE sent_at >= %s
                """,
                (start_date,)
            )
            metrics['messages_sent'] = cur.fetchone()[0]
        
        # Clinician Metrics
        if role in ['admin']:
            # Active clinicians
            cur.execute('SELECT COUNT(*) FROM clinicians WHERE active = true')
            metrics['active_clinicians'] = cur.fetchone()[0]
            
            # Clinician workload
            cur.execute(
                """
                SELECT 
                    c.id,
                    u.full_name,
                    COUNT(DISTINCT pc.patient_id) as patient_count,
                    COUNT(a.id) as appointment_count
                FROM clinicians c
                JOIN users u ON u.id = c.user_id
                LEFT JOIN patient_clinician pc ON pc.clinician_id = c.id
                LEFT JOIN appointments a ON a.clinician_id = c.id 
                    AND a.appointment_time >= %s
                WHERE c.active = true
                GROUP BY c.id, u.full_name
                ORDER BY patient_count DESC
                LIMIT 10
                """,
                (start_date,)
            )
            clinician_workload = cur.fetchall()
            metrics['clinician_workload'] = [
                {
                    'clinician_id': row[0],
                    'name': row[1],
                    'patient_count': row[2],
                    'appointment_count': row[3]
                }
                for row in clinician_workload
            ]
        
        # Access Log Metrics (Security)
        if role == 'admin':
            # Recent access activity
            cur.execute(
                """
                SELECT 
                    action,
                    COUNT(*) as count
                FROM access_log
                WHERE accessed_at >= %s
                GROUP BY action
                ORDER BY count DESC
                LIMIT 10
                """,
                (start_date,)
            )
            access_stats = cur.fetchall()
            metrics['access_activity'] = [
                {'action': row[0], 'count': row[1]}
                for row in access_stats
            ]
            
            # Unique users active
            cur.execute(
                """
                SELECT COUNT(DISTINCT user_id)
                FROM access_log
                WHERE accessed_at >= %s
                """,
                (start_date,)
            )
            metrics['active_users'] = cur.fetchone()[0]
        
        # Patient-specific metrics
        if role == 'patient':
            # Get patient ID
            cur.execute('SELECT id FROM patients WHERE user_id = %s', (user_id,))
            patient_result = cur.fetchone()
            
            if patient_result:
                patient_id = patient_result[0]
                
                # My appointments
                cur.execute(
                    """
                    SELECT COUNT(*), status
                    FROM appointments
                    WHERE patient_id = %s AND appointment_time >= %s
                    GROUP BY status
                    """,
                    (patient_id, start_date)
                )
                my_appointments = cur.fetchall()
                metrics['my_appointments'] = {
                    'total': sum(row[0] for row in my_appointments),
                    'by_status': {row[1]: row[0] for row in my_appointments}
                }
                
                # My assessments
                cur.execute(
                    """
                    SELECT COUNT(*)
                    FROM psyconnect
                    WHERE patient_id = %s AND assessed_at >= %s
                    """,
                    (patient_id, start_date)
                )
                metrics['my_assessments'] = cur.fetchone()[0]
                
                # My homework
                cur.execute(
                    """
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed
                    FROM therapy_homework
                    WHERE patient_id = %s AND assigned_at >= %s
                    """,
                    (patient_id, start_date)
                )
                homework = cur.fetchone()
                metrics['my_homework'] = {
                    'total': homework[0],
                    'completed': homework[1] or 0,
                    'completion_rate': (homework[1] / homework[0] * 100) if homework[0] > 0 else 0
                }
        
        return jsonify({
            'time_range': time_range,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'metrics': metrics
        }), 200
    
    except Exception as e:
        audit_logger.log_security_event('ANALYTICS_DASHBOARD_ERROR', user_id, request.remote_addr, str(e))
        return jsonify({'error': 'An error occurred while fetching analytics dashboard metrics'}), 500
    finally:
        cur.close()


@analytics_bp.route('/analytics/trends', methods=['GET'])
@jwt_required()
@audit_log('VIEW', 'analytics_trends')
def get_trends():
    """
    Get trend data over time
    
    Query params:
        - metric: 'appointments', 'assessments', 'vitals', 'messages'
        - period: 'daily', 'weekly', 'monthly' (default: 'daily')
        - days: number of days to look back (default: 30)
    
    Returns:
        Time series data for the specified metric
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    
    metric = request.args.get('metric', 'appointments')
    period = request.args.get('period', 'daily')
    days = int(request.args.get('days', 30))
    
    start_date = datetime.now() - timedelta(days=days)
    
    db = get_db()
    cur = db.cursor()
    
    try:
        # Determine date truncation based on period
        if period == 'weekly':
            date_trunc = "DATE_TRUNC('week', %s)"
        elif period == 'monthly':
            date_trunc = "DATE_TRUNC('month', %s)"
        else:  # daily
            date_trunc = "DATE_TRUNC('day', %s)"
        
        trend_data = []
        
        if metric == 'appointments' and role in ['admin', 'clinician']:
            query = f"""
                SELECT 
                    {date_trunc.replace('%s', 'appointment_time')} as period,
                    COUNT(*) as count,
                    status
                FROM appointments
                WHERE appointment_time >= %s
                GROUP BY period, status
                ORDER BY period
            """
            cur.execute(query, (start_date,))
            results = cur.fetchall()
            
            # Group by period
            period_data = {}
            for row in results:
                period_key = row[0].isoformat()
                if period_key not in period_data:
                    period_data[period_key] = {'period': period_key, 'total': 0, 'by_status': {}}
                period_data[period_key]['total'] += row[1]
                period_data[period_key]['by_status'][row[2]] = row[1]
            
            trend_data = list(period_data.values())
        
        elif metric == 'assessments' and role in ['admin', 'clinician']:
            query = f"""
                SELECT 
                    {date_trunc.replace('%s', 'assessed_at')} as period,
                    COUNT(*) as count,
                    assessment_type
                FROM psyconnect
                WHERE assessed_at >= %s
                GROUP BY period, assessment_type
                ORDER BY period
            """
            cur.execute(query, (start_date,))
            results = cur.fetchall()
            
            period_data = {}
            for row in results:
                period_key = row[0].isoformat()
                if period_key not in period_data:
                    period_data[period_key] = {'period': period_key, 'total': 0, 'by_type': {}}
                period_data[period_key]['total'] += row[1]
                period_data[period_key]['by_type'][row[2]] = row[1]
            
            trend_data = list(period_data.values())
        
        elif metric == 'vitals' and role in ['admin', 'clinician']:
            query = f"""
                SELECT 
                    {date_trunc.replace('%s', 'recorded_at')} as period,
                    AVG(heart_rate) as avg_hr,
                    COUNT(*) as count
                FROM vitals
                WHERE recorded_at >= %s AND heart_rate IS NOT NULL
                GROUP BY period
                ORDER BY period
            """
            cur.execute(query, (start_date,))
            results = cur.fetchall()
            
            trend_data = [
                {
                    'period': row[0].isoformat(),
                    'avg_heart_rate': float(row[1]) if row[1] else 0,
                    'reading_count': row[2]
                }
                for row in results
            ]
        
        elif metric == 'messages' and role in ['admin', 'clinician']:
            query = f"""
                SELECT 
                    {date_trunc.replace('%s', 'sent_at')} as period,
                    COUNT(*) as count
                FROM messages
                WHERE sent_at >= %s
                GROUP BY period
                ORDER BY period
            """
            cur.execute(query, (start_date,))
            results = cur.fetchall()
            
            trend_data = [
                {'period': row[0].isoformat(), 'count': row[1]}
                for row in results
            ]
        
        return jsonify({
            'metric': metric,
            'period': period,
            'days': days,
            'start_date': start_date.isoformat(),
            'data': trend_data
        }), 200
    
    except Exception as e:
        audit_logger.log_security_event('ANALYTICS_TRENDS_ERROR', user_id, request.remote_addr, str(e))
        return jsonify({'error': 'An error occurred while fetching analytics trends'}), 500
    finally:
        cur.close()


@analytics_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
@audit_log('VIEW', 'analytics_performance')
def get_performance_metrics():
    """
    Get system performance metrics (admin only)
    
    Returns:
        Database performance, query stats, system health
    """
    claims = get_jwt()
    role = claims.get('role', 'patient')
    
    if role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    db = get_db()
    cur = db.cursor()
    
    try:
        metrics = {}
        
        # Database size
        cur.execute(
            """
            SELECT pg_database_size(current_database()) as db_size
            """
        )
        db_size = cur.fetchone()[0]
        metrics['database_size_mb'] = db_size / (1024 * 1024)
        
        # Table sizes
        cur.execute(
            """
            SELECT 
                schemaname,
                tablename,
                pg_total_relation_size(schemaname||'.'||tablename) as size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY size DESC
            LIMIT 10
            """
        )
        table_sizes = cur.fetchall()
        metrics['largest_tables'] = [
            {
                'schema': row[0],
                'table': row[1],
                'size_mb': row[2] / (1024 * 1024)
            }
            for row in table_sizes
        ]
        
        # Connection stats
        cur.execute(
            """
            SELECT 
                COUNT(*) as total_connections,
                COUNT(*) FILTER (WHERE state = 'active') as active_connections,
                COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity
            WHERE datname = current_database()
            """
        )
        conn_stats = cur.fetchone()
        metrics['connections'] = {
            'total': conn_stats[0],
            'active': conn_stats[1],
            'idle': conn_stats[2]
        }
        
        # Cache hit ratio
        cur.execute(
            """
            SELECT 
                sum(heap_blks_read) as heap_read,
                sum(heap_blks_hit) as heap_hit,
                sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
            FROM pg_statio_user_tables
            """
        )
        cache_stats = cur.fetchone()
        metrics['cache_hit_ratio'] = float(cache_stats[2]) if cache_stats[2] else 0
        
        # Recent slow queries (would need pg_stat_statements extension)
        # For now, return placeholder
        metrics['slow_queries'] = []
        
        return jsonify(metrics), 200
    
    except Exception as e:
        audit_logger.log_security_event('PERFORMANCE_METRICS_ERROR', None, request.remote_addr, str(e))
        return jsonify({'error': 'An error occurred while fetching performance metrics'}), 500
    finally:
        cur.close()


@analytics_bp.route('/analytics/reports/generate', methods=['POST'])
@jwt_required()
@audit_log('CREATE', 'analytics_report')
def generate_report():
    """
    Generate a custom analytics report
    
    Request body:
        - report_type: 'patient_summary', 'clinician_workload', 'assessment_outcomes', 'system_usage'
        - start_date: ISO format date
        - end_date: ISO format date
        - filters: Optional filters (patient_ids, clinician_ids, etc.)
    
    Returns:
        Generated report data
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    
    if role not in ['admin', 'clinician']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    report_type = data.get('report_type')
    start_date = datetime.fromisoformat(data.get('start_date', (datetime.now() - timedelta(days=30)).isoformat()))
    end_date = datetime.fromisoformat(data.get('end_date', datetime.now().isoformat()))
    filters = data.get('filters', {})
    
    db = get_db()
    cur = db.cursor()
    
    try:
        report_data = {
            'report_type': report_type,
            'generated_at': datetime.now().isoformat(),
            'generated_by': user_id,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'data': []
        }
        
        if report_type == 'patient_summary':
            # Patient summary report
            query = """
                SELECT 
                    p.id,
                    u.full_name,
                    p.date_of_birth,
                    p.gender,
                    COUNT(DISTINCT a.id) as appointment_count,
                    COUNT(DISTINCT ts.id) as session_count,
                    COUNT(DISTINCT pc.id) as assessment_count
                FROM patients p
                JOIN users u ON u.id = p.user_id
                LEFT JOIN appointments a ON a.patient_id = p.id 
                    AND a.appointment_time BETWEEN %s AND %s
                LEFT JOIN therapy_sessions ts ON ts.appointment_id = a.id
                LEFT JOIN psyconnect pc ON pc.patient_id = p.id 
                    AND pc.assessed_at BETWEEN %s AND %s
                GROUP BY p.id, u.full_name, p.date_of_birth, p.gender
                ORDER BY appointment_count DESC
            """
            cur.execute(query, (start_date, end_date, start_date, end_date))
            results = cur.fetchall()
            
            report_data['data'] = [
                {
                    'patient_id': row[0],
                    'name': row[1],
                    'date_of_birth': row[2].isoformat() if row[2] else None,
                    'gender': row[3],
                    'appointments': row[4],
                    'sessions': row[5],
                    'assessments': row[6]
                }
                for row in results
            ]
        
        elif report_type == 'clinician_workload':
            # Clinician workload report
            query = """
                SELECT 
                    c.id,
                    u.full_name,
                    c.specialty,
                    COUNT(DISTINCT pc.patient_id) as patient_count,
                    COUNT(DISTINCT a.id) as appointment_count,
                    COUNT(DISTINCT ts.id) as session_count,
                    AVG(ts.duration_minutes) as avg_session_duration
                FROM clinicians c
                JOIN users u ON u.id = c.user_id
                LEFT JOIN patient_clinician pc ON pc.clinician_id = c.id
                LEFT JOIN appointments a ON a.clinician_id = c.id 
                    AND a.appointment_time BETWEEN %s AND %s
                LEFT JOIN therapy_sessions ts ON ts.appointment_id = a.id
                WHERE c.active = true
                GROUP BY c.id, u.full_name, c.specialty
                ORDER BY appointment_count DESC
            """
            cur.execute(query, (start_date, end_date))
            results = cur.fetchall()
            
            report_data['data'] = [
                {
                    'clinician_id': row[0],
                    'name': row[1],
                    'specialty': row[2],
                    'patient_count': row[3],
                    'appointments': row[4],
                    'sessions': row[5],
                    'avg_session_duration': float(row[6]) if row[6] else 0
                }
                for row in results
            ]
        
        return jsonify(report_data), 200
    
    except Exception as e:
        audit_logger.log_security_event('REPORT_GENERATION_ERROR', user_id, request.remote_addr, str(e))
        return jsonify({'error': 'An error occurred while generating report'}), 500
    finally:
        cur.close()
