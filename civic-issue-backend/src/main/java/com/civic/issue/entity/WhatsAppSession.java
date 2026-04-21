package com.civic.issue.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_sessions")
public class WhatsAppSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private String state = "IDLE";

    @Column(columnDefinition = "TEXT")
    private String tempImageUrl;

    private Double tempLatitude;
    private Double tempLongitude;
    private String tempCategory;

    @Column(columnDefinition = "TEXT")
    private String tempTitle;

    @Column(columnDefinition = "TEXT")
    private String tempDescription;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WhatsAppSession() {}

    public WhatsAppSession(String phone) {
        this.phone = phone;
    }

    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getTempImageUrl() { return tempImageUrl; }
    public void setTempImageUrl(String tempImageUrl) { this.tempImageUrl = tempImageUrl; }
    public Double getTempLatitude() { return tempLatitude; }
    public void setTempLatitude(Double lat) { this.tempLatitude = lat; }
    public Double getTempLongitude() { return tempLongitude; }
    public void setTempLongitude(Double lng) { this.tempLongitude = lng; }
    public String getTempCategory() { return tempCategory; }
    public void setTempCategory(String cat) { this.tempCategory = cat; }
    public String getTempTitle() { return tempTitle; }
    public void setTempTitle(String title) { this.tempTitle = title; }
    public String getTempDescription() { return tempDescription; }
    public void setTempDescription(String desc) { this.tempDescription = desc; }

    // Manual Builder
    public static WhatsAppSessionBuilder builder() {
        return new WhatsAppSessionBuilder();
    }

    public static class WhatsAppSessionBuilder {
        private WhatsAppSession res = new WhatsAppSession();
        public WhatsAppSessionBuilder phone(String p) { res.phone = p; return this; }
        public WhatsAppSessionBuilder state(String s) { res.state = s; return this; }
        public WhatsAppSessionBuilder tempImageUrl(String u) { res.tempImageUrl = u; return this; }
        public WhatsAppSessionBuilder tempLatitude(Double l) { res.tempLatitude = l; return this; }
        public WhatsAppSessionBuilder tempLongitude(Double l) { res.tempLongitude = l; return this; }
        public WhatsAppSessionBuilder tempDescription(String d) { res.tempDescription = d; return this; }
        public WhatsAppSession build() { return res; }
    }
}
