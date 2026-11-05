/**
 * CEDIREKO Films Portfolio - Design Token & Interface Contract Verifier
 * Verifies CSS custom properties, WCAG 2.1 AA contrast ratios, and typography specifications.
 */

const fs = require('fs');

class DesignTokenContract {
  constructor(cssContent) {
    this.css = cssContent;
    this.tokens = this.extractRootTokens();
  }

  static fromFile(cssPath) {
    const content = fs.readFileSync(cssPath, 'utf8');
    return new DesignTokenContract(content);
  }

  extractRootTokens() {
    const tokens = {};
    const rootMatches = this.css.match(/:root\s*\{([^}]+)\}/g);
    if (!rootMatches) return tokens;

    for (const block of rootMatches) {
      const declarations = block.replace(/:root\s*\{/, '').replace('}', '').split(';');
      for (const decl of declarations) {
        const parts = decl.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          if (key.startsWith('--')) {
            tokens[key] = value;
          }
        }
      }
    }
    return tokens;
  }

  getToken(name) {
    return this.tokens[name];
  }

  hasToken(name) {
    return Object.prototype.hasOwnProperty.call(this.tokens, name);
  }

  /**
   * Resolves hex color (e.g. #3C0008 or #3c0008)
   */
  static parseHex(hexStr) {
    let hex = hexStr.replace('#', '').trim();
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  /**
   * Calculates relative luminance according to WCAG 2.1 formula
   */
  static getLuminance(rgb) {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Computes WCAG 2.1 contrast ratio between two hex colors
   */
  static getContrastRatio(hex1, hex2) {
    const lum1 = DesignTokenContract.getLuminance(DesignTokenContract.parseHex(hex1));
    const lum2 = DesignTokenContract.getLuminance(DesignTokenContract.parseHex(hex2));
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }
}

class DomContract {
  constructor(htmlContent) {
    this.html = htmlContent;
  }

  static fromFile(htmlPath) {
    const content = fs.readFileSync(htmlPath, 'utf8');
    return new DomContract(content);
  }

  contains(pattern) {
    if (pattern instanceof RegExp) {
      return pattern.test(this.html);
    }
    return this.html.includes(pattern);
  }

  countOccurrences(subStr) {
    return (this.html.match(new RegExp(subStr, 'g')) || []).length;
  }
}

module.exports = { DesignTokenContract, DomContract };
