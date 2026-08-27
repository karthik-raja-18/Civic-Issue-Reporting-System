package com.civic.issue.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatResponse {

    private String        answer;
    private boolean        grounded; // true if real retrieved data backed this answer
    private List<Source>   sources;  // which past issues were used as evidence

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Source {
        private Long   issueId;
        private String title;
        private String category;
        private String zone;
        private long   relevancePercent;
    }
}
