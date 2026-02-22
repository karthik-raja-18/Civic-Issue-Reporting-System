package com.civic.issue.dto.response;

import com.civic.issue.enums.IssueStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private IssueStatus status;
    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private UserSummary createdBy;
    private List<CommentResponse> comments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }
}
