"""
Cleanup script for temporary files and sessions
Run this periodically to clean up old session data
"""
import os
import shutil
from datetime import datetime, timedelta

def cleanup_temp_sessions(days_old=1):
    """
    Remove session directories older than specified days
    
    Args:
        days_old: Remove sessions older than this many days
    """
    temp_dir = os.path.join(os.path.dirname(__file__), "temp_sessions")
    
    if not os.path.exists(temp_dir):
        print("No temp_sessions directory found")
        return
    
    cutoff_time = datetime.now() - timedelta(days=days_old)
    removed_count = 0
    
    for session_dir in os.listdir(temp_dir):
        session_path = os.path.join(temp_dir, session_dir)
        
        if not os.path.isdir(session_path):
            continue
        
        # Check modification time
        mod_time = datetime.fromtimestamp(os.path.getmtime(session_path))
        
        if mod_time < cutoff_time:
            try:
                shutil.rmtree(session_path)
                removed_count += 1
                print(f"Removed old session: {session_dir}")
            except Exception as e:
                print(f"Error removing {session_dir}: {e}")
    
    print(f"\nCleanup complete! Removed {removed_count} old session(s)")

def cleanup_pycache():
    """Remove all __pycache__ directories"""
    removed_count = 0
    base_dir = os.path.dirname(__file__)
    
    for root, dirs, files in os.walk(base_dir):
        if '__pycache__' in dirs:
            cache_path = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(cache_path)
                removed_count += 1
                print(f"Removed: {cache_path}")
            except Exception as e:
                print(f"Error removing {cache_path}: {e}")
    
    print(f"\nRemoved {removed_count} __pycache__ director(ies)")

if __name__ == "__main__":
    print("=" * 50)
    print("SQL Workspace Cleanup Script")
    print("=" * 50)
    print()
    
    print("Cleaning up old sessions...")
    cleanup_temp_sessions(days_old=1)
    
    print("\nCleaning up Python cache...")
    cleanup_pycache()
    
    print("\n" + "=" * 50)
    print("Cleanup finished!")
    print("=" * 50)

