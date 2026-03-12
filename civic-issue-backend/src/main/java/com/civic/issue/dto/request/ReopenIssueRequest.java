package com.civic.issue.dto.request;

import lombok.Data;

@Data
public class ReopenIssueRequest {

    // Optional — reporter can describe what's still wrong
    private String note;
}
