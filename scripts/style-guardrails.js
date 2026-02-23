#!/usr/bin/env node
/**
 * Style Guardrails Script (PR-030 / RF-030)
 * 
 * Prevents style drift by detecting:
 * 1. Raw hex color literals (e.g., #FFFFFF, #000) in migrated files
 * 2. Inline style objects (e.g., style={{ color: 'red' }}) in migrated files
 * 
 * Uses a baseline file to tolerate existing violations while preventing new ones.
 * 
 * Usage:
 *   node scripts/style-guardrails.js [--update-baseline] [--verbose]
 * 
 * Options:
 *   --update-baseline  Update the baseline file with current violations
 *   --verbose          Show detailed violation information
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Files that have been migrated to ALF primitives
  // Add new migrated files here as migration progresses
  migratedFiles: [
    'src/components/BottomNavigation.tsx',
    'src/components/ui/ScreenHeader.tsx',
    'src/components/ui/ModalHeader.tsx',
  ],
  
  // Baseline file location
  baselineFile: 'scripts/style-guardrails-baseline.json',
  
  // Patterns to detect
  patterns: {
    // Matches hex color literals like #fff, #FFFFFF, #000000
    // Excludes hex in comments and strings that are clearly not colors
    hexLiteral: /#[0-9A-Fa-f]{3,8}\b/g,
    
    // Matches inline style objects: style={{ ... }} or style={[ ... ]}
    // This is a simplified pattern - we'll do more precise detection in code
    inlineStyleObject: /style=\{[^}]*\{/g,
  },
  
  // Allowed patterns (won't be flagged as violations)
  // These are patterns that look like hex but are allowed
  allowedPatterns: [
    // Import statements
    /^import\s/,
    // Comment lines
    /^\s*\/\//,
    /^\s*\*/,
    /^\s*\/\*/,
  ],
  
  // Files/directories to always ignore
  ignorePatterns: [
    'node_modules',
    '__tests__',
    '.test.',
    '.spec.',
    'test-utils',
  ],
};

// Parse command line arguments
const args = process.argv.slice(2);
const updateBaseline = args.includes('--update-baseline');
const verbose = args.includes('--verbose');

/**
 * Read a file and return its contents
 */
function readFile(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Check if a line should be ignored based on allowed patterns
 */
function shouldIgnoreLine(line) {
  return CONFIG.allowedPatterns.some(pattern => pattern.test(line));
}

/**
 * Check if a file should be ignored
 */
function shouldIgnoreFile(filePath) {
  return CONFIG.ignorePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Find hex literal violations in a file
 */
function findHexLiterals(content, filePath) {
  const violations = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (shouldIgnoreLine(line)) return;
    
    // Look for hex color patterns
    const matches = line.match(CONFIG.patterns.hexLiteral);
    if (matches) {
      matches.forEach(match => {
        // Skip if it's in an import statement or comment
        if (line.includes('import ') || line.trim().startsWith('//') || line.trim().startsWith('*')) {
          return;
        }
        
        // Skip if it's using a token (e.g., GRAY[300], STATIC.black)
        // These are allowed uses of color tokens
        if (/\b(GRAY|STATIC|BRAND|SEMANTIC)\b/.test(line)) {
          // Only flag if the hex is not part of a token file
          if (!filePath.includes('tokens')) {
            violations.push({
              file: filePath,
              line: index + 1,
              column: line.indexOf(match) + 1,
              match,
              message: `Raw hex literal "${match}" found. Use ALF tokens instead (e.g., GRAY[600], STATIC.white).`,
              type: 'hex-literal',
            });
          }
        } else {
          violations.push({
            file: filePath,
            line: index + 1,
            column: line.indexOf(match) + 1,
            match,
            message: `Raw hex literal "${match}" found. Use ALF tokens instead (e.g., GRAY[600], STATIC.white).`,
            type: 'hex-literal',
          });
        }
      });
    }
  });
  
  return violations;
}

/**
 * Find inline style object violations in a file
 */
function findInlineStyleObjects(content, filePath) {
  const violations = [];
  const lines = content.split('\n');
  
  // Track if we're inside a style array (for multi-line detection)
  let inStyleArray = false;
  let styleArrayStartLine = 0;
  
  lines.forEach((line, index) => {
    if (shouldIgnoreLine(line)) return;
    
    // Detect start of style array: style={[
    if (/style=\{\s*\[/.test(line)) {
      inStyleArray = true;
      styleArrayStartLine = index + 1;
    }
    
    // Detect end of style array: ]}
    if (inStyleArray && /\]\}/.test(line)) {
      inStyleArray = false;
    }
    
    // Detect inline object literals within style arrays (multi-line)
    // Pattern: && { or , { which indicates inline style object
    if (inStyleArray) {
      const hasInlineObjectInArray = /&&\s*\{/.test(line) || /,\s*\{(?![^}]*styles\.)/.test(line);
      if (hasInlineObjectInArray) {
        violations.push({
          file: filePath,
          line: index + 1,
          column: line.indexOf('{') + 1,
          match: line.trim().substring(0, 60) + (line.trim().length > 60 ? '...' : ''),
          message: 'Inline style object found. Move styles to StyleSheet.create() or use Box/Text primitives.',
          type: 'inline-style',
        });
      }
    }
    
    // Detect style={{ ... }} pattern (single line inline object)
    const inlineStyleMatch = line.match(/style=\{\s*\{/);
    if (inlineStyleMatch) {
      violations.push({
        file: filePath,
        line: index + 1,
        column: line.indexOf('style=') + 1,
        match: line.trim().substring(0, 60) + (line.trim().length > 60 ? '...' : ''),
        message: 'Inline style object found. Move styles to StyleSheet.create() or use Box/Text primitives.',
        type: 'inline-style',
      });
    }
  });
  
  return violations;
}

/**
 * Load the baseline file
 */
function loadBaseline() {
  const baselinePath = path.resolve(process.cwd(), CONFIG.baselineFile);
  if (!fs.existsSync(baselinePath)) {
    return { violations: [], timestamp: null };
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

/**
 * Save the baseline file
 */
function saveBaseline(violations) {
  const baselinePath = path.resolve(process.cwd(), CONFIG.baselineFile);
  const baseline = {
    timestamp: new Date().toISOString(),
    description: 'Baseline violations for style guardrails. These are tolerated existing violations.',
    violations: violations.map(v => ({
      file: v.file,
      line: v.line,
      type: v.type,
      match: v.match,
    })),
  };
  
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`\n✅ Baseline updated with ${violations.length} violations.`);
}

/**
 * Generate a unique key for a violation for comparison
 */
function violationKey(v) {
  return `${v.file}:${v.type}:${v.match}`;
}

/**
 * Check if a violation is in the baseline
 */
function isInBaseline(violation, baseline) {
  const key = violationKey(violation);
  return baseline.violations.some(b => violationKey(b) === key);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Style Guardrails Check\n');
  
  const allViolations = [];
  
  // Check each migrated file
  CONFIG.migratedFiles.forEach(filePath => {
    if (shouldIgnoreFile(filePath)) return;
    
    const content = readFile(filePath);
    if (!content) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    if (verbose) {
      console.log(`Checking: ${filePath}`);
    }
    
    // Find violations
    const hexViolations = findHexLiterals(content, filePath);
    const inlineViolations = findInlineStyleObjects(content, filePath);
    
    allViolations.push(...hexViolations, ...inlineViolations);
  });
  
  if (updateBaseline) {
    saveBaseline(allViolations);
    return;
  }
  
  // Load baseline and check for new violations
  const baseline = loadBaseline();
  const baselineKeys = new Set(baseline.violations.map(violationKey));
  
  const newViolations = allViolations.filter(v => !baselineKeys.has(violationKey(v)));
  const resolvedViolations = baseline.violations.filter(b => 
    !allViolations.some(v => violationKey(v) === violationKey(b))
  );
  
  // Report results
  console.log(`📊 Results:`);
  console.log(`   Total violations: ${allViolations.length}`);
  console.log(`   Baseline violations: ${baseline.violations.length}`);
  console.log(`   New violations: ${newViolations.length}`);
  console.log(`   Resolved violations: ${resolvedViolations.length}`);
  
  if (resolvedViolations.length > 0 && verbose) {
    console.log('\n✅ Resolved violations (can be removed from baseline):');
    resolvedViolations.forEach(v => {
      console.log(`   ${v.file}:${v.line} - ${v.type}: ${v.match}`);
    });
  }
  
  if (newViolations.length > 0) {
    console.log('\n❌ New violations detected:\n');
    newViolations.forEach(v => {
      console.log(`  ${v.file}:${v.line}:${v.column}`);
      console.log(`    ${v.message}`);
      console.log(`    Found: ${v.match}\n`);
    });
    
    console.log('💡 To fix:');
    console.log('   - Replace hex literals with ALF tokens (GRAY, STATIC, BRAND, SEMANTIC)');
    console.log('   - Move inline styles to StyleSheet.create() or use Box/Text primitives');
    console.log('   - If this is intentional, run: npm run style-guardrails:update-baseline\n');
    
    process.exit(1);
  }
  
  console.log('\n✅ No new style violations detected!');
  
  if (resolvedViolations.length > 0) {
    console.log('\n💡 Some baseline violations have been resolved. Consider updating the baseline:');
    console.log('   npm run style-guardrails:update-baseline\n');
  }
}

main();
