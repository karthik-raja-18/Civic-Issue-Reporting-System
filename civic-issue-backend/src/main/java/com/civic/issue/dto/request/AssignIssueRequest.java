package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignIssueRequest {

    @NotNull(message = "Admin ID is required")
    private Long adminId;
}
