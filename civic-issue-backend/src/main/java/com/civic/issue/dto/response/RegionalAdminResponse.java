package com.civic.issue.dto.response;

import com.civic.issue.enums.Zone;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionalAdminResponse {
    private Long   id;
    private String name;
    private String email;
    private Zone   zone;
    private String zoneDescription;
    private long   totalIssues;
    private long   pendingIssues;
    private long   resolvedIssues;
}
