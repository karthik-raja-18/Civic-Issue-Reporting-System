package com.civic.issue.dto.response;

import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long     id;
    private String   name;
    private String   email;
    private RoleType role;
    private Zone     zone;
    private String   phone;
    private String   avatarUrl;
}
