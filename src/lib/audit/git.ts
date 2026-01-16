/**
 * Git Version History Utilities for BigTurbo Agent Audit System
 *
 * Provides version history tracking for agent prompt files using git.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface FileVersion {
  commit: GitCommit;
  content: string;
}

export interface VersionDiff {
  oldVersion: FileVersion | null;
  newVersion: FileVersion;
  additions: number;
  deletions: number;
  diff: string;
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * Check if the current directory is a git repository.
 */
export async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execAsync('git rev-parse --is-inside-work-tree', { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get commit history for a specific file.
 *
 * @param filePath - Absolute or relative path to the file
 * @param limit - Maximum number of commits to retrieve
 * @returns Array of commits, newest first
 */
export async function getFileHistory(
  filePath: string,
  limit: number = 10
): Promise<GitCommit[]> {
  const cwd = process.cwd();
  const relativePath = path.relative(cwd, filePath);

  try {
    // Format: hash|short_hash|author|date|message
    const format = '%H|%h|%an|%aI|%s';
    const { stdout } = await execAsync(
      `git log -n ${limit} --format="${format}" -- "${relativePath}"`,
      { cwd }
    );

    if (!stdout.trim()) {
      return [];
    }

    return stdout
      .trim()
      .split('\n')
      .map((line) => {
        const [hash, shortHash, author, date, message] = line.split('|');
        return {
          hash,
          shortHash,
          author,
          date,
          message,
        };
      });
  } catch (error) {
    console.error('Error getting file history:', error);
    return [];
  }
}

/**
 * Get file content at a specific commit.
 *
 * @param filePath - Path to the file
 * @param commitHash - Git commit hash
 * @returns File content at that commit, or null if not found
 */
export async function getFileAtCommit(
  filePath: string,
  commitHash: string
): Promise<string | null> {
  const cwd = process.cwd();
  const relativePath = path.relative(cwd, filePath);

  try {
    const { stdout } = await execAsync(
      `git show ${commitHash}:"${relativePath}"`,
      { cwd }
    );
    return stdout;
  } catch (error) {
    console.error(`Error getting file at commit ${commitHash}:`, error);
    return null;
  }
}

/**
 * Get a specific version of a file with its commit info.
 *
 * @param filePath - Path to the file
 * @param commitHash - Git commit hash
 * @returns File version with content and commit info
 */
export async function getFileVersion(
  filePath: string,
  commitHash: string
): Promise<FileVersion | null> {
  const history = await getFileHistory(filePath, 50);
  const commit = history.find((c) => c.hash === commitHash || c.shortHash === commitHash);

  if (!commit) {
    return null;
  }

  const content = await getFileAtCommit(filePath, commitHash);
  if (!content) {
    return null;
  }

  return { commit, content };
}

/**
 * Get all versions of a file with content.
 *
 * @param filePath - Path to the file
 * @param limit - Maximum number of versions
 * @returns Array of file versions
 */
export async function getAllFileVersions(
  filePath: string,
  limit: number = 10
): Promise<FileVersion[]> {
  const history = await getFileHistory(filePath, limit);
  const versions: FileVersion[] = [];

  for (const commit of history) {
    const content = await getFileAtCommit(filePath, commit.hash);
    if (content) {
      versions.push({ commit, content });
    }
  }

  return versions;
}

/**
 * Get diff between two commits for a file.
 *
 * @param filePath - Path to the file
 * @param oldHash - Older commit hash (or null for initial version)
 * @param newHash - Newer commit hash
 * @returns Diff information
 */
export async function getFileDiff(
  filePath: string,
  oldHash: string | null,
  newHash: string
): Promise<VersionDiff | null> {
  const cwd = process.cwd();
  const relativePath = path.relative(cwd, filePath);

  try {
    const newVersion = await getFileVersion(filePath, newHash);
    if (!newVersion) {
      return null;
    }

    let oldVersion: FileVersion | null = null;
    let diff = '';
    let additions = 0;
    let deletions = 0;

    if (oldHash) {
      oldVersion = await getFileVersion(filePath, oldHash);

      // Get unified diff
      const { stdout } = await execAsync(
        `git diff ${oldHash} ${newHash} -- "${relativePath}"`,
        { cwd }
      );
      diff = stdout;

      // Count additions and deletions
      const lines = diff.split('\n');
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
        }
      }
    } else {
      // Initial version - all lines are additions
      additions = newVersion.content.split('\n').length;
      diff = newVersion.content
        .split('\n')
        .map((line) => `+ ${line}`)
        .join('\n');
    }

    return {
      oldVersion,
      newVersion,
      additions,
      deletions,
      diff,
    };
  } catch (error) {
    console.error('Error getting file diff:', error);
    return null;
  }
}

/**
 * Get current (working directory) version of a file.
 *
 * @param filePath - Path to the file
 * @returns Current content or null if file doesn't exist
 */
export async function getCurrentFileContent(filePath: string): Promise<string | null> {
  try {
    const { promises: fs } = await import('fs');
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Check if file has uncommitted changes.
 *
 * @param filePath - Path to the file
 * @returns True if file has uncommitted changes
 */
export async function hasUncommittedChanges(filePath: string): Promise<boolean> {
  const cwd = process.cwd();
  const relativePath = path.relative(cwd, filePath);

  try {
    const { stdout } = await execAsync(
      `git status --porcelain "${relativePath}"`,
      { cwd }
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}
