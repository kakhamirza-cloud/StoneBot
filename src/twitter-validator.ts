import fetch from 'node-fetch';

export class TwitterValidator {
  private static readonly TWITTER_BASE_URL = 'https://twitter.com/';
  private static readonly TWITTER_X_URL = 'https://x.com/';
  
  /**
   * Validates if a Twitter handle is real and not a bot
   */
  static async validateTwitterHandle(handle: string): Promise<{ isValid: boolean; isBot: boolean; error?: string }> {
    try {
      // Clean the handle (remove @ if present)
      const cleanHandle = handle.replace('@', '').trim();
      
      if (!cleanHandle || cleanHandle.length < 1 || cleanHandle.length > 15) {
        return { isValid: false, isBot: false, error: 'Invalid handle format' };
      }
      
      // Check for suspicious patterns that might indicate bots
      if (this.isSuspiciousHandle(cleanHandle)) {
        return { isValid: false, isBot: true, error: 'Handle appears to be a bot account' };
      }
      
      // Try to check if the profile exists
      const profileExists = await this.checkProfileExists(cleanHandle);
      
      if (!profileExists) {
        return { isValid: false, isBot: false, error: 'Twitter profile does not exist' };
      }
      
      // Additional bot detection
      const isBot = await this.detectBotAccount(cleanHandle);
      
      if (isBot) {
        return { isValid: false, isBot: true, error: 'Account appears to be a bot' };
      }
      
      return { isValid: true, isBot: false };
      
    } catch (error) {
      console.error('Error validating Twitter handle:', error);
      return { isValid: false, isBot: false, error: 'Validation failed' };
    }
  }
  
  /**
   * Check for suspicious handle patterns
   */
  private static isSuspiciousHandle(handle: string): boolean {
    const suspiciousPatterns = [
      /^bot/i,           // Starts with "bot"
      /bot$/i,            // Ends with "bot"
      /_bot_/i,           // Contains "_bot_"
      /^[0-9]+$/,         // Only numbers
      /^[a-z]+[0-9]+[a-z]+$/i, // Mixed pattern like "user123bot"
      /spam/i,            // Contains "spam"
      /fake/i,            // Contains "fake"
      /test/i,            // Contains "test"
      /temp/i,            // Contains "temp"
      /dummy/i,           // Contains "dummy"
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(handle));
  }
  
  /**
   * Check if a Twitter profile exists by trying to access it
   */
  private static async checkProfileExists(handle: string): Promise<boolean> {
    try {
      const urls = [
        `${this.TWITTER_BASE_URL}${handle}`,
        `${this.TWITTER_X_URL}${handle}`
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // If we get a 200 response, the profile exists
          if (response.status === 200) {
            return true;
          }
          
          // If we get a 404, the profile doesn't exist
          if (response.status === 404) {
            return false;
          }
          
        } catch (error) {
          // Continue to next URL if this one fails
          continue;
        }
      }
      
      // If all URLs fail, assume it doesn't exist
      return false;
      
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }
  
  /**
   * Detect if an account is likely a bot
   */
  private static async detectBotAccount(handle: string): Promise<boolean> {
    try {
      // Try to get the profile page content
      const url = `${this.TWITTER_BASE_URL}${handle}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.status !== 200) {
        return false;
      }
      
      const html = await response.text();
      
      // Look for bot indicators in the HTML
      const botIndicators = [
        'This account is suspended',
        'This account doesn\'t exist',
        'Account suspended',
        'This account has been suspended',
        'bot account',
        'automated account',
        'spam account'
      ];
      
      const lowerHtml = html.toLowerCase();
      return botIndicators.some(indicator => lowerHtml.includes(indicator.toLowerCase()));
      
    } catch (error) {
      console.error('Error detecting bot account:', error);
      return false;
    }
  }
  
  /**
   * Extract Twitter handle from a URL
   */
  static extractHandleFromUrl(url: string): string | null {
    try {
      const patterns = [
        /twitter\.com\/([a-zA-Z0-9_]+)/,
        /x\.com\/([a-zA-Z0-9_]+)/,
        /t\.co\/[a-zA-Z0-9]+/ // Shortened URLs
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting handle from URL:', error);
      return null;
    }
  }
  
  /**
   * Check if a URL is a Twitter/X URL
   */
  static isTwitterUrl(url: string): boolean {
    const twitterDomains = [
      'twitter.com',
      'x.com',
      't.co'
    ];
    
    try {
      const urlObj = new URL(url);
      return twitterDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (error) {
      return false;
    }
  }
}
