# Ocean App - Follow System Documentation

## 🎯 **Overview**
The follow system allows users to follow other users, creating a social network within the marketplace. Users can follow buyers and sellers to stay updated with their posts and activities.

---

## 🗄️ **Database Model**

### **UserFollows Table**
```javascript
{
  id: UUID (Primary Key),
  userId: UUID (Foreign Key to UserTable - The follower),
  followsUserId: UUID (Foreign Key to UserTable - The user being followed),
  createdAt: DATE,
  updatedAt: DATE
}
```

**Key Features:**
- ✅ **Unique constraint** on `[userId, followsUserId]` prevents duplicate follows
- ✅ **Self-follow prevention** - Users cannot follow themselves
- ✅ **Proper associations** with UserTable for easy queries
- ✅ **Timestamps** track when follow relationship was created

---

## 🔌 **API Endpoints**

### **Base URL**
```
http://localhost:3000
```

### **1. Follow a User**
**POST** `/api/follow`

Follow another user.

**Request Body:**
```json
{
  "targetUserId": "uuid-of-user-to-follow"
}
```

**Response (201):**
```json
{
  "message": "You are now following John Doe",
  "followedUser": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Target user ID is required
- `400` - You cannot follow yourself
- `400` - You are already following this user
- `404` - User not found

### **2. Unfollow a User**
**POST** `/api/unfollow`

Unfollow a user you're currently following.

**Request Body:**
```json
{
  "targetUserId": "uuid-of-user-to-unfollow"
}
```

**Response (200):**
```json
{
  "message": "You have unfollowed John Doe",
  "unfollowedUser": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Target user ID is required
- `400` - You are not following this user

### **3. Get User's Followers**
**GET** `/api/users/:userId/followers?page=1&limit=20`

Get list of users who follow the specified user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
{
  "message": "Followers retrieved successfully",
  "followers": [
    {
      "id": "uuid",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "accountType": "buyer",
      "accountStatus": "active",
      "followedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalFollowers": 100,
    "followersPerPage": 20
  }
}
```

### **4. Get User's Following List**
**GET** `/api/users/:userId/following?page=1&limit=20`

Get list of users that the specified user is following.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
{
  "message": "Following list retrieved successfully",
  "following": [
    {
      "id": "uuid",
      "fullName": "Bob Wilson",
      "email": "bob@example.com",
      "accountType": "seller",
      "accountStatus": "active",
      "followedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalFollowing": 50,
    "followingPerPage": 20
  }
}
```

### **5. Check Follow Status**
**GET** `/api/users/:targetUserId/follow-status`

Check if current user is following a specific user.

**Response (200):**
```json
{
  "message": "Follow status retrieved successfully",
  "isFollowing": true,
  "followedAt": "2024-01-01T00:00:00.000Z"
}
```

### **6. Get Follow Statistics**
**GET** `/api/users/:userId/follow-stats`

Get follower and following counts for a user.

**Response (200):**
```json
{
  "message": "Follow statistics retrieved successfully",
  "stats": {
    "userId": "uuid",
    "followersCount": 150,
    "followingCount": 75
  }
}
```

### **7. Get Mutual Followers**
**GET** `/api/users/:userId/mutual-followers?page=1&limit=20`

Get users who follow each other (mutual followers).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
{
  "message": "Mutual followers retrieved successfully",
  "mutualFollowers": [
    {
      "id": "uuid",
      "fullName": "Alice Johnson",
      "email": "alice@example.com",
      "accountType": "buyer",
      "accountStatus": "active"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalMutualFollowers": 25,
    "mutualFollowersPerPage": 20
  }
}
```

---

## 🔐 **Authentication Requirements**

### **Protected Endpoints**
These endpoints require a valid JWT token in cookies:
- `POST /api/follow`
- `POST /api/unfollow`
- `GET /api/users/:targetUserId/follow-status`
- `GET /api/users/:userId/mutual-followers`

### **Public Endpoints**
These endpoints can be accessed without authentication:
- `GET /api/users/:userId/followers`
- `GET /api/users/:userId/following`
- `GET /api/users/:userId/follow-stats`

---

## 🧪 **Testing with Postman**

### **Prerequisites**
1. **User Registration**: Create test users first
2. **Authentication**: Login to get JWT token
3. **User IDs**: Note down user IDs for testing

### **Test Flow**

#### **1. Create Test Users**
```bash
# Register User 1
POST /api/signup
{
  "fullName": "Test User 1",
  "email": "user1@test.com",
  "password": "TestPass123!",
  "phoneNumber": "+1234567890",
  "address": "123 Test St",
  "country": "United States",
  "state": "California",
  "agreeTerms": true
}

# Register User 2
POST /api/signup
{
  "fullName": "Test User 2",
  "email": "user2@test.com",
  "password": "TestPass123!",
  "phoneNumber": "+1234567891",
  "address": "456 Test Ave",
  "country": "United States",
  "state": "California",
  "agreeTerms": true
}
```

#### **2. Login and Get Token**
```bash
# Login as User 1
POST /api/login
{
  "email": "user1@test.com",
  "password": "TestPass123!"
}
# Save the JWT token from cookies
```

#### **3. Test Follow Functionality**
```bash
# Follow User 2
POST /api/follow
Headers: Cookie: token=your_jwt_token
{
  "targetUserId": "user2-uuid"
}

# Check follow status
GET /api/users/user2-uuid/follow-status
Headers: Cookie: token=your_jwt_token

# Get User 2's followers
GET /api/users/user2-uuid/followers

# Get User 1's following list
GET /api/users/user1-uuid/following

# Get follow statistics
GET /api/users/user1-uuid/follow-stats

# Unfollow User 2
POST /api/unfollow
Headers: Cookie: token=your_jwt_token
{
  "targetUserId": "user2-uuid"
}
```

---

## 🎨 **Frontend Integration Examples**

### **Follow Button Component**
```javascript
const FollowButton = ({ targetUserId, initialFollowStatus }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ targetUserId })
      });
      
      if (response.ok) {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/unfollow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ targetUserId })
      });
      
      if (response.ok) {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Unfollow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      disabled={isLoading}
      className={isFollowing ? 'unfollow-btn' : 'follow-btn'}
    >
      {isLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
  );
};
```

### **Followers List Component**
```javascript
const FollowersList = ({ userId }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async (page = 1) => {
    try {
      const response = await fetch(`/api/users/${userId}/followers?page=${page}&limit=20`);
      const data = await response.json();
      
      if (response.ok) {
        setFollowers(data.followers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading followers...</div>;

  return (
    <div className="followers-list">
      <h3>Followers ({pagination.totalFollowers})</h3>
      {followers.map(follower => (
        <div key={follower.id} className="follower-item">
          <span>{follower.fullName}</span>
          <span>{follower.accountType}</span>
          <span>Followed: {new Date(follower.followedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔧 **Error Handling**

### **Common Error Scenarios**
1. **Self-follow attempt**: User tries to follow themselves
2. **Duplicate follow**: User tries to follow someone they already follow
3. **Invalid user ID**: Target user doesn't exist
4. **Authentication required**: Missing or invalid JWT token
5. **Database constraints**: Unique constraint violations

### **Error Response Format**
```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

---

## 📊 **Performance Considerations**

### **Optimizations Implemented**
- ✅ **Pagination** for large follower/following lists
- ✅ **Efficient queries** with proper indexing
- ✅ **Raw SQL** for complex mutual follower queries
- ✅ **Selective attributes** to reduce data transfer
- ✅ **Caching opportunities** for follow statistics

### **Recommended Indexes**
```sql
-- Already implemented in the model
CREATE UNIQUE INDEX idx_user_follows_unique ON user_follows(userId, followsUserId);
CREATE INDEX idx_user_follows_follower ON user_follows(followsUserId);
CREATE INDEX idx_user_follows_following ON user_follows(userId);
```

---

## 🚀 **Future Enhancements**

### **Potential Features**
1. **Follow notifications** - Notify users when someone follows them
2. **Follow suggestions** - Recommend users to follow based on interests
3. **Follow analytics** - Track follow/unfollow patterns
4. **Follow verification** - Verified follower badges
5. **Follow categories** - Follow users by interest categories

### **Integration with Feed System**
- Show posts from followed users in feed
- Filter feed by followed users only
- Highlight posts from followed users

---

This follow system provides a solid foundation for social features in your Ocean app marketplace! 🎯 