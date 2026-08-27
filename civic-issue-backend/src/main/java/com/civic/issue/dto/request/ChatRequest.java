package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {

    @NotBlank(message = "Question cannot be empty")
    @Size(max = 500, message = "Question too long — keep it under 500 characters")
    private String question;
}
