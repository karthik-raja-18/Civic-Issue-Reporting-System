package com.civic.issue.entity;

import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleType role = RoleType.USER;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Zone zone;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_id")
    private String oauthId;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "phone", length = 20)
    private String phone;

    public User() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public RoleType getRole() { return role; }
    public void setRole(RoleType role) { this.role = role; }
    public Zone getZone() { return zone; }
    public void setZone(Zone zone) { this.zone = zone; }
    public String getOauthProvider() { return oauthProvider; }
    public void setOauthProvider(String oauthProvider) { this.oauthProvider = oauthProvider; }
    public String getOauthId() { return oauthId; }
    public void setOauthId(String oauthId) { this.oauthId = oauthId; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    // Manual Builder
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private User user = new User();
        
        public UserBuilder id(Long id) { user.id = id; return this; }
        public UserBuilder name(String n) { user.name = n; return this; }
        public UserBuilder email(String e) { user.email = e; return this; }
        public UserBuilder phone(String p) { user.phone = p; return this; }
        public UserBuilder password(String p) { user.password = p; return this; }
        public UserBuilder role(RoleType r) { user.role = r; return this; }
        public UserBuilder zone(Zone z) { user.zone = z; return this; }
        public UserBuilder oauthProvider(String op) { user.oauthProvider = op; return this; }
        public UserBuilder oauthId(String oi) { user.oauthId = oi; return this; }
        public UserBuilder avatarUrl(String au) { user.avatarUrl = au; return this; }
        
        public User build() { return user; }
    }
}
