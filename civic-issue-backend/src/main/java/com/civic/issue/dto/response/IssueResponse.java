package com.civic.issue.dto.response;

import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.Zone;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueResponse {

    private Long            id;
    private String          title;
    private String          description;
    private String          category;
    private IssueStatus     status;
    private Zone            zone;
    private String          imageUrl;           // reporter's before photo
    private String          resolvedImageUrl;   // ✅ admin's after/proof photo
    private String          reopenNote;         // ✅ reporter's note when reopening
    private Double          latitude;
    private Double          longitude;
    private LocalDateTime   createdAt;
    private UserSummary     createdBy;
    private UserSummary     assignedTo;
    private List<CommentResponse> comments;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long   id;
        private String name;
        private String email;
    }
}
