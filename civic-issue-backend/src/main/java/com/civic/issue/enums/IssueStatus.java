package com.civic.issue.enums;

public enum IssueStatus {
    PENDING,       // Just submitted — waiting for admin to start
    IN_PROGRESS,   // Admin is working on it
    RESOLVED,      // Admin marked resolved + uploaded proof photo, waiting reporter to confirm
    CLOSED,        // Reporter confirmed ✅ fully done
    REOPENED       // Reporter rejected resolution — admin needs to fix again
}
