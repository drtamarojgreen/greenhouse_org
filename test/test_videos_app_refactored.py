"""
Comprehensive tests for the Videos app using the organized test framework.
"""

from base_test import BaseAppTest
from test_utils import TestAssertions, ElementLocators
from selenium.webdriver.common.by import By


class TestVideosApp(BaseAppTest):
    """Test class for the Videos application."""
    
    # App configuration
    APP_NAME = 'videos'
    APP_VIEW_CLASS = 'greenhouse-videos-view'
    APP_CONTENT_CLASS = 'greenhouse-videos-content'
    APP_LIST_ID = 'videos-list'
    APP_ITEM_CLASS = 'greenhouse-video-item'
    EXPECTED_TITLE = 'Greenhouse Shorts'
    EXPECTED_INTRO_TEXT = 'Check out the latest short videos from @greenhousemhd!'
    
    def verify_item_structure(self, item, item_number):
        """Verify the structure of individual video items."""
        print(f"    Verifying Video Item {item_number} structure:")
        
        # Verify video title (h3.greenhouse-video-title)
        video_title = item.find_element(By.CSS_SELECTOR, 'h3.greenhouse-video-title')
        self.assertIsNotNone(video_title, f"Video Item {item_number}: Title not found")
        self.assertGreater(len(video_title.text.strip()), 0, 
                          f"Video Item {item_number}: Title text is empty")
        print(f"      ✓ Title: '{video_title.text.strip()}'")
        
        # Verify video player (iframe.greenhouse-video-player)
        video_player = item.find_element(By.CSS_SELECTOR, 'iframe.greenhouse-video-player')
        self.assertIsNotNone(video_player, f"Video Item {item_number}: Video player not found")
        src = video_player.get_attribute('src')
        self.assertGreater(len(src), 0, f"Video Item {item_number}: Video player src is empty")
        print(f"      ✓ Player src: '{src}'")
        
        # Verify video description (p without class)
        video_description = item.find_element(By.XPATH, './p[not(@class)]')
        self.assertIsNotNone(video_description, f"Video Item {item_number}: Description not found")
        self.assertGreater(len(video_description.text.strip()), 0, 
                          f"Video Item {item_number}: Description text is empty")
        print(f"      ✓ Description: '{video_description.text.strip()}'")
    
    def test_video_player_attributes(self):
        """Test that video players have proper attributes for accessibility and functionality."""
        print("\n--- Testing Video Player Attributes ---")
        
        # Wait for video items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all video players
        players = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} iframe.greenhouse-video-player')
        
        players_with_proper_attributes = 0
        
        for i, player in enumerate(players):
            print(f"  Checking Video Player {i+1}:")
            
            # Check src attribute
            src = player.get_attribute('src')
            has_src = src and len(src) > 0
            print(f"    ✓ Has src: {has_src}")
            
            # Check title attribute for accessibility
            title = player.get_attribute('title')
            has_title = title and len(title) > 0
            print(f"    {'✓' if has_title else '⚠'} Has title: {has_title}")
            
            # Check allowfullscreen attribute
            allowfullscreen = player.get_attribute('allowfullscreen')
            has_allowfullscreen = allowfullscreen is not None
            print(f"    {'✓' if has_allowfullscreen else '⚠'} Has allowfullscreen: {has_allowfullscreen}")
            
            # Check frameborder attribute (should be 0 for modern styling)
            frameborder = player.get_attribute('frameborder')
            proper_frameborder = frameborder == '0'
            print(f"    {'✓' if proper_frameborder else '⚠'} Proper frameborder: {proper_frameborder}")
            
            # Count as properly configured if has src and at least 2 other attributes
            attribute_count = sum([has_src, has_title, has_allowfullscreen, proper_frameborder])
            if attribute_count >= 3:
                players_with_proper_attributes += 1
        
        # At least 80% should have proper attributes
        if players:
            proper_rate = players_with_proper_attributes / len(players)
            self.assertGreaterEqual(proper_rate, 0.8, 
                                   f"Only {proper_rate:.1%} of players have proper attributes")
            print(f"✓ {players_with_proper_attributes}/{len(players)} players have proper attributes")
    
    def test_video_src_validity(self):
        """Test that video sources are valid URLs."""
        print("\n--- Testing Video Source Validity ---")
        
        # Wait for video items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all video players
        players = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} iframe.greenhouse-video-player')
        
        valid_sources = 0
        valid_platforms = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com']
        
        for i, player in enumerate(players):
            src = player.get_attribute('src')
            
            if src:
                # Check if it's a valid URL
                is_valid_url = src.startswith('http')
                
                # Check if it's from a known video platform
                is_known_platform = any(platform in src for platform in valid_platforms)
                
                if is_valid_url and is_known_platform:
                    valid_sources += 1
                    platform = next((p for p in valid_platforms if p in src), 'unknown')
                    print(f"  ✓ Video {i+1}: Valid {platform} URL")
                else:
                    print(f"  ⚠ Video {i+1}: Invalid or unknown platform URL: {src}")
            else:
                print(f"  ⚠ Video {i+1}: No source URL")
        
        # At least 90% should have valid sources
        if players:
            valid_rate = valid_sources / len(players)
            self.assertGreaterEqual(valid_rate, 0.9, 
                                   f"Only {valid_rate:.1%} of videos have valid sources")
            print(f"✓ {valid_sources}/{len(players)} videos have valid sources")
    
    def test_video_layout_container_class(self):
        """Test that the videos list has the proper layout container class."""
        print("\n--- Testing Videos Layout Container Class ---")
        
        videos_list = self.wait_for_element((By.ID, self.APP_LIST_ID))
        class_attr = videos_list.get_attribute('class')
        
        self.assertIn('greenhouse-layout-container', class_attr, 
                     "Videos list missing greenhouse-layout-container class")
        print("✓ Videos list has greenhouse-layout-container class")
    
    def test_video_responsive_design(self):
        """Test that video players are responsive."""
        print("\n--- Testing Video Responsive Design ---")
        
        # Wait for video items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Test different viewport sizes
        viewports = [
            (1920, 1080, "Desktop"),
            (768, 1024, "Tablet"),
            (375, 667, "Mobile")
        ]
        
        for width, height, device in viewports:
            print(f"  Testing {device} viewport ({width}x{height})")
            self.driver.set_window_size(width, height)
            
            # Wait for layout to adjust
            import time
            time.sleep(1)
            
            # Check that video players are still visible
            players = self.safe_find_elements((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} iframe.greenhouse-video-player'))
            self.assertGreater(len(players), 0, f"No video players visible on {device}")
            
            # Check that players have reasonable dimensions
            for i, player in enumerate(players[:3]):  # Check first 3 players
                rect = player.rect
                width_px = rect['width']
                height_px = rect['height']
                
                # Players should have some minimum size and reasonable aspect ratio
                self.assertGreater(width_px, 100, f"Player {i+1} too narrow on {device}")
                self.assertGreater(height_px, 50, f"Player {i+1} too short on {device}")
                
                aspect_ratio = width_px / height_px if height_px > 0 else 0
                self.assertGreater(aspect_ratio, 0.5, f"Player {i+1} aspect ratio too narrow on {device}")
                self.assertLess(aspect_ratio, 3.0, f"Player {i+1} aspect ratio too wide on {device}")
            
            print(f"    ✓ {len(players)} video players properly sized on {device}")
        
        # Reset to default size
        self.driver.set_window_size(1920, 1080)
    
    def test_video_accessibility(self):
        """Test video accessibility features."""
        print("\n--- Testing Video Accessibility ---")
        
        # Wait for video items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all video players
        players = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} iframe.greenhouse-video-player')
        
        accessible_players = 0
        
        for i, player in enumerate(players):
            accessibility_score = 0
            
            # Check for title attribute
            title = player.get_attribute('title')
            if title and len(title.strip()) > 0:
                accessibility_score += 1
                print(f"  ✓ Player {i+1} has title: '{title}'")
            else:
                print(f"  ⚠ Player {i+1} missing title attribute")
            
            # Check for aria-label
            aria_label = player.get_attribute('aria-label')
            if aria_label and len(aria_label.strip()) > 0:
                accessibility_score += 1
                print(f"  ✓ Player {i+1} has aria-label: '{aria_label}'")
            
            # Check if player is keyboard accessible (has tabindex or is naturally focusable)
            tabindex = player.get_attribute('tabindex')
            if tabindex is not None or player.tag_name.lower() == 'iframe':
                accessibility_score += 1
                print(f"  ✓ Player {i+1} is keyboard accessible")
            
            # Consider accessible if it has at least 2 accessibility features
            if accessibility_score >= 2:
                accessible_players += 1
        
        # At least 70% should be accessible
        if players:
            accessible_rate = accessible_players / len(players)
            self.assertGreaterEqual(accessible_rate, 0.7, 
                                   f"Only {accessible_rate:.1%} of players are accessible")
            print(f"✓ {accessible_players}/{len(players)} players are accessible")
    
    def test_video_content_quality(self):
        """Test the quality of video titles and descriptions."""
        print("\n--- Testing Video Content Quality ---")
        
        # Wait for video items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all video items
        video_items = self.driver.find_elements(By.CLASS_NAME, self.APP_ITEM_CLASS)
        
        quality_videos = 0
        
        for i, item in enumerate(video_items):
            quality_score = 0
            
            # Check title quality
            try:
                title_elem = item.find_element(By.CSS_SELECTOR, 'h3.greenhouse-video-title')
                title_text = title_elem.text.strip()
                
                if len(title_text) >= 10:  # Meaningful title length
                    quality_score += 1
                    print(f"  ✓ Video {i+1} has meaningful title length")
                else:
                    print(f"  ⚠ Video {i+1} title too short: '{title_text}'")
            except Exception:
                print(f"  ⚠ Video {i+1} missing title")
            
            # Check description quality
            try:
                desc_elem = item.find_element(By.XPATH, './p[not(@class)]')
                desc_text = desc_elem.text.strip()
                
                if len(desc_text) >= 20:  # Meaningful description length
                    quality_score += 1
                    print(f"  ✓ Video {i+1} has meaningful description length")
                else:
                    print(f"  ⚠ Video {i+1} description too short: '{desc_text}'")
            except Exception:
                print(f"  ⚠ Video {i+1} missing description")
            
            # Consider high quality if it has both good title and description
            if quality_score >= 2:
                quality_videos += 1
        
        # At least 60% should be high quality
        if video_items:
            quality_rate = quality_videos / len(video_items)
            self.assertGreaterEqual(quality_rate, 0.6, 
                                   f"Only {quality_rate:.1%} of videos are high quality")
            print(f"✓ {quality_videos}/{len(video_items)} videos are high quality")


if __name__ == '__main__':
    import unittest
    unittest.main()
