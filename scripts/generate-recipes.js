#!/usr/bin/env node

/**
 * Cross-platform script to generate recipe data
 * This script:
 * 1. Builds the neu-recipe-processor package
 * 2. Runs the processor to generate recipe data
 * 3. Copies the output files to the web app data directory
 */

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths relative to the script location
const ROOT_DIR = join(__dirname, '..');
const PROCESSOR_DIR = join(ROOT_DIR, 'packages', 'neu-recipe-processor');
const OUTPUT_DIR = join(PROCESSOR_DIR, 'output');
const WEB_DATA_DIR = join(ROOT_DIR, 'apps', 'web', 'data');

const RECIPES_FILE = 'recipes_items.json';
const ITEMS_FILE = 'items.json';
const MERGED_ITEMS_FILE = 'merged_items.json';

function log(message) {
    console.log(`[generate-recipes] ${message}`);
}

function execCommand(command, cwd) {
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            encoding: 'utf-8'
        });
    } catch (error) {
        console.error(`Failed to execute: ${command}`);
        process.exit(1);
    }
}

function copyFile(source, destination) {
    try {
        if (!existsSync(source)) {
            throw new Error(`Source file not found: ${source}`);
        }

        // Ensure destination directory exists
        const destDir = dirname(destination);
        if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
        }

        copyFileSync(source, destination);
        log(`Copied: ${source} -> ${destination}`);
    } catch (error) {
        console.error(`Failed to copy file: ${error.message}`);
        process.exit(1);
    }
}

function main() {
    log('Starting recipe generation process...');

    // Step 1: Build the processor
    log('Building neu-recipe-processor...');
    execCommand('pnpm run build', PROCESSOR_DIR);

    // Step 2: Run the processor
    log('Running recipe processor...');
    execCommand('node dist/index.js', PROCESSOR_DIR);

    // Step 3: Copy output files
    log('Copying generated files to web app...');

    const recipesSource = join(OUTPUT_DIR, RECIPES_FILE);
    const recipesDestination = join(WEB_DATA_DIR, RECIPES_FILE);
    copyFile(recipesSource, recipesDestination);

    const itemsSource = join(OUTPUT_DIR, MERGED_ITEMS_FILE);
    const itemsDestination = join(WEB_DATA_DIR, ITEMS_FILE);
    copyFile(itemsSource, itemsDestination);

    log('Recipe generation completed successfully! ✓');
}

main();
