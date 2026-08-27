package com.civic.issue.repository;

import com.civic.issue.entity.ChatMessage;
import com.civic.issue.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUserOrderByCreatedAtAsc(User user);

    // Last N messages for short conversational memory in the prompt
    List<ChatMessage> findTop10ByUserOrderByCreatedAtDesc(User user);
}
