# 🔐 Firebase安全检查清单

## ⚠️ 密钥泄露后的安全评估

虽然Firebase API密钥本身不是真正的"秘密",但你仍需要立即检查以下安全设置:

---

## 📋 立即检查以下项目:

### 1. ✅ Firebase Authentication设置
访问: https://console.firebase.google.com/project/codefest2025---insightloan/authentication/providers

**必须检查:**
- ✅ 只启用了Email/Password登录方式
- ✅ 没有启用匿名登录
- ✅ 没有启用"测试模式"
- ✅ 邮箱验证设置是否符合预期

**当前状态:** 
- 你使用了Email/Password认证
- 需要确认是否要求邮箱验证

---

### 2. ✅ Firestore数据库安全规则
访问: https://console.firebase.google.com/project/codefest2025---insightloan/firestore/rules

**危险配置示例 (绝对不能有!):**
```javascript
// ❌ 危险! 任何人都可以读写
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**安全配置示例:**
```javascript
// ✅ 安全! 只有认证用户可以访问
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**如果你还没有使用Firestore,可以暂时忽略此项**

---

### 3. ✅ Firebase Storage安全规则
访问: https://console.firebase.google.com/project/codefest2025---insightloan/storage/rules

**危险配置示例:**
```javascript
// ❌ 危险! 任何人都可以上传/下载
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**安全配置示例:**
```javascript
// ✅ 安全! 只有认证用户可以访问
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**如果你还没有使用Storage,可以暂时忽略此项**

---

### 4. ✅ 授权域名限制
访问: https://console.firebase.google.com/project/codefest2025---insightloan/authentication/settings

**检查 "Authorized domains":**
- ✅ 应该只包含你信任的域名
- ✅ 本地开发: `localhost`
- ✅ 生产环境: 你的实际域名

**删除任何可疑或不需要的域名**

---

### 5. ✅ 检查现有用户
访问: https://console.firebase.google.com/project/codefest2025---insightloan/authentication/users

**检查是否有:**
- ❌ 未授权的账户
- ❌ 可疑的邮箱地址
- ❌ 创建时间异常的账户

**如果发现可疑账户,立即删除**

---

### 6. ✅ 使用监控
访问: https://console.firebase.google.com/project/codefest2025---insightloan/usage

**检查:**
- 读写次数是否异常
- 存储使用量是否暴增
- 认证请求是否激增

**如果发现异常,可能已被攻击**

---

## 🎯 快速决策指南

### 情况A: 你的Security Rules配置正确
- ✅ Authentication只允许Email/Password
- ✅ 要求用户认证才能访问数据
- ✅ 授权域名只有localhost和你的域名
- ✅ 没有发现可疑用户

**结论:** 不更换密钥也是**安全的**,可以继续使用

---

### 情况B: 你不确定Security Rules是否正确
- ⚠️ 没有配置Firestore/Storage规则
- ⚠️ 或者规则设置为"测试模式"(allow read, write: if true)

**结论:** **必须立即修复Security Rules** 或者 **轮换密钥**

---

### 情况C: 发现可疑活动
- ❌ 有未授权的用户账户
- ❌ 使用量异常激增
- ❌ 可疑的读写活动

**结论:** **立即轮换密钥并修复Security Rules**

---

## 💡 建议

### 短期内(今天):
1. 检查上述6个安全项目
2. 如果都正常,可以继续使用现有密钥
3. 监控Firebase使用情况

### 长期建议:
1. 设置Firebase Security Rules为最佳实践
2. 启用邮箱验证
3. 配置使用限额提醒
4. 定期审查用户列表

---

## 🔗 快速链接

- Firebase Console: https://console.firebase.google.com/project/codefest2025---insightloan
- Security Rules文档: https://firebase.google.com/docs/rules
- Authentication文档: https://firebase.google.com/docs/auth

---

**更新时间:** November 26, 2025
**优先级:** 高 - 建议在24小时内完成检查
