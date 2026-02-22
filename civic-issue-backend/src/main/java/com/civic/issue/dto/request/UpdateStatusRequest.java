package com.civic.issue.dto.request;

import com.civic.issue.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private IssueStatus status;
}
