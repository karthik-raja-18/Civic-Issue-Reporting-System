package com.civic.issue.repository;

import com.civic.issue.entity.CategoryFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryFeedbackRepository extends JpaRepository<CategoryFeedback, Long> {

    // Useful for an admin "AI accuracy" report — which categories get
    // corrected most often, i.e. where the model is weakest.
    List<CategoryFeedback> findByAiSuggested(String aiSuggested);
}
