const http = require("http");
const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

const app = require("./app");
const User = require("./models/User");
const Resource = require("./models/Resource");
const Folder = require("./models/Folder");
const Notification = require("./models/Notification");
const Student = require("./models/Student");

let server;
let baseUrl;

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on("error", (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const testResults = [];
function recordTest(category, testName, passed, details = "") {
  testResults.push({ category, testName, passed, details });
  const statusStr = passed ? "✓ PASS" : "❌ FAIL";
  console.log(`[${statusStr}] [${category}] ${testName} ${details ? "- " + details : ""}`);
}

async function runTests() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for testing.");

    // Start Express server on random free port
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server running at ${baseUrl}\n`);

    // Clean test data
    await User.deleteMany({ email: /@test-suite\.org$/i });
    await Resource.deleteMany({ title: /^\[TEST\]/ });
    await Folder.deleteMany({ name: /^\[TEST\]/ });
    await Notification.deleteMany({ message: /\[TEST\]/ });
    await Student.deleteMany({ email: /@test-suite\.org$/i });

    // ----------------------------------------------------
    // 1. AUTHENTICATION & USER REGISTRATION TESTS
    // ----------------------------------------------------
    console.log("=== 1. Testing Authentication & User Registration ===");

    // Register Admin
    const adminReg = await request("POST", "/api/auth/register", {
      name: "Test Admin",
      email: "admin@test-suite.org",
      password: "Password123!",
      schoolName: "Admin High School",
      role: "Admin",
    });
    recordTest("Auth", "Register Admin User", adminReg.status === 201 && adminReg.body.token, `Status: ${adminReg.status}`);
    const adminToken = adminReg.body.token;
    const adminUser = adminReg.body.user;

    // Register Educator 1
    const edu1Reg = await request("POST", "/api/auth/register", {
      name: "Test Educator 1",
      email: "educator1@test-suite.org",
      password: "Password123!",
      schoolName: "Rural Elementary",
      role: "Educator",
    });
    recordTest("Auth", "Register Educator 1", edu1Reg.status === 201 && edu1Reg.body.token, `Status: ${edu1Reg.status}`);
    const edu1Token = edu1Reg.body.token;
    const edu1User = edu1Reg.body.user;

    // Register Educator 2
    const edu2Reg = await request("POST", "/api/auth/register", {
      name: "Test Educator 2",
      email: "educator2@test-suite.org",
      password: "Password123!",
      schoolName: "Valley Public School",
      role: "Educator",
    });
    recordTest("Auth", "Register Educator 2", edu2Reg.status === 201 && edu2Reg.body.token, `Status: ${edu2Reg.status}`);
    const edu2Token = edu2Reg.body.token;
    const edu2User = edu2Reg.body.user;

    // Register Student
    const studentReg = await request("POST", "/api/auth/register", {
      name: "Test Student",
      email: "student@test-suite.org",
      password: "Password123!",
      schoolName: "Rural High",
      role: "Student",
    });
    recordTest("Auth", "Register Student User", studentReg.status === 201 && studentReg.body.token, `Status: ${studentReg.status}`);
    const studentToken = studentReg.body.token;
    const studentUser = studentReg.body.user;

    // Login Educator
    const loginRes = await request("POST", "/api/auth/login", {
      email: "educator1@test-suite.org",
      password: "Password123!",
    });
    recordTest("Auth", "Login with valid credentials", loginRes.status === 200 && loginRes.body.token, `Status: ${loginRes.status}`);

    // Login with wrong password (400)
    const badLogin = await request("POST", "/api/auth/login", {
      email: "educator1@test-suite.org",
      password: "WrongPassword!",
    });
    recordTest("Auth", "Login with invalid password returns 400", badLogin.status === 400, `Status: ${badLogin.status}`);

    // GET /me with valid token
    const meRes = await request("GET", "/api/auth/me", null, edu1Token);
    recordTest("Auth", "GET /api/auth/me with valid JWT token", meRes.status === 200 && meRes.body.email === "educator1@test-suite.org", `Status: ${meRes.status}`);

    // GET /me without token (401)
    const noTokenMe = await request("GET", "/api/auth/me");
    recordTest("Auth", "GET /api/auth/me without token returns 401", noTokenMe.status === 401, `Status: ${noTokenMe.status}`);

    // ----------------------------------------------------
    // 2. ADMIN ROLE & PRIVILEGE TESTS
    // ----------------------------------------------------
    console.log("\n=== 2. Testing Admin Role & Permission Control ===");

    // GET /users (Admin Only)
    const adminGetUsers = await request("GET", "/api/auth/users", null, adminToken);
    recordTest("Admin", "Admin can access GET /api/auth/users", adminGetUsers.status === 200 && Array.isArray(adminGetUsers.body), `Status: ${adminGetUsers.status}`);

    const eduGetUsers = await request("GET", "/api/auth/users", null, edu1Token);
    recordTest("Admin", "Educator accessing GET /api/auth/users returns 403", eduGetUsers.status === 403, `Status: ${eduGetUsers.status}`);

    const studentGetUsers = await request("GET", "/api/auth/users", null, studentToken);
    recordTest("Admin", "Student accessing GET /api/auth/users returns 403", studentGetUsers.status === 403, `Status: ${studentGetUsers.status}`);

    const anonGetUsers = await request("GET", "/api/auth/users");
    recordTest("Admin", "Unauthenticated accessing GET /api/auth/users returns 401", anonGetUsers.status === 401, `Status: ${anonGetUsers.status}`);

    // PUT /users/:id/role
    const adminUpdateRole = await request("PUT", `/api/auth/users/${studentUser.id}/role`, { role: "Student" }, adminToken);
    recordTest("Admin", "Admin can update user role", adminUpdateRole.status === 200, `Status: ${adminUpdateRole.status}`);

    const eduUpdateRole = await request("PUT", `/api/auth/users/${studentUser.id}/role`, { role: "Admin" }, edu1Token);
    recordTest("Admin", "Educator updating user role returns 403", eduUpdateRole.status === 403, `Status: ${eduUpdateRole.status}`);

    // Non-Admin Profile Role Escalation Prevention
    const studentEscalate = await request("PUT", "/api/auth/profile", { role: "Admin" }, studentToken);
    recordTest("Admin", "Student attempting role escalation in profile update is prevented", studentEscalate.status === 200 && studentEscalate.body.user.role === "Student", `Role remained: ${studentEscalate.body.user?.role}`);

    // Admin Self-Delete Protection
    const adminSelfDelete = await request("DELETE", `/api/auth/users/${adminUser.id}`, null, adminToken);
    recordTest("Admin", "Admin deleting self returns 400", adminSelfDelete.status === 400, `Status: ${adminSelfDelete.status}`);

    // ----------------------------------------------------
    // 3. RESOURCE MANAGEMENT & PUBLIC ACCESSIBILITY TESTS
    // ----------------------------------------------------
    console.log("\n=== 3. Testing Resource Management & Permissions ===");

    // Create Resource by Educator 1
    const resCreateEdu = await request("POST", "/api/resources", {
      title: "[TEST] Math Worksheet",
      description: "Basic Algebra for Grade 6",
      category: "Worksheet",
      subject: "Math",
      gradeLevel: "Middle",
      content: "Solve: 2x + 5 = 15",
    }, edu1Token);
    recordTest("Resource", "Educator can create resource", resCreateEdu.status === 201 && resCreateEdu.body._id, `Status: ${resCreateEdu.status}`);
    const testResourceId = resCreateEdu.body._id;

    // Create Resource by Student (Forbidden -> 403)
    const resCreateStudent = await request("POST", "/api/resources", {
      title: "[TEST] Student Note",
      description: "Notes",
      category: "Worksheet",
      subject: "Math",
      gradeLevel: "Middle",
      content: "Notes text",
    }, studentToken);
    recordTest("Resource", "Student creating resource returns 403 Forbidden", resCreateStudent.status === 403, `Status: ${resCreateStudent.status}`);

    // Create Resource Unauthenticated (401)
    const resCreateAnon = await request("POST", "/api/resources", {
      title: "[TEST] Anon Note",
      category: "Worksheet",
      subject: "Math",
      gradeLevel: "Middle",
      content: "Notes text",
    });
    recordTest("Resource", "Unauthenticated creating resource returns 401 Unauthorized", resCreateAnon.status === 401, `Status: ${resCreateAnon.status}`);

    // Public Read Resources (GET /api/resources)
    const resGetPublic = await request("GET", "/api/resources");
    recordTest("Resource", "Public GET /api/resources accessible without token", resGetPublic.status === 200 && Array.isArray(resGetPublic.body), `Status: ${resGetPublic.status}`);

    // Public Read Single Resource (GET /api/resources/:id)
    const resGetSingle = await request("GET", `/api/resources/${testResourceId}`);
    recordTest("Resource", "Public GET /api/resources/:id accessible without token", resGetSingle.status === 200 && resGetSingle.body.title === "[TEST] Math Worksheet", `Status: ${resGetSingle.status}`);

    // Top Performing Resources (GET /api/resources/top)
    const resGetTop = await request("GET", "/api/resources/top");
    recordTest("Resource", "Public GET /api/resources/top accessible without token", resGetTop.status === 200, `Status: ${resGetTop.status}`);

    // Download Count (POST /api/resources/:id/download)
    const resDownload = await request("POST", `/api/resources/${testResourceId}/download`);
    recordTest("Resource", "Public POST /api/resources/:id/download increments count", resDownload.status === 200 && resDownload.body.downloadCount > 0, `Download Count: ${resDownload.body.downloadCount}`);

    // Update Resource by Owner Educator 1 (200)
    const resUpdateOwner = await request("PUT", `/api/resources/${testResourceId}`, {
      title: "[TEST] Math Worksheet Updated",
    }, edu1Token);
    recordTest("Resource", "Owner Educator can update resource", resUpdateOwner.status === 200 && resUpdateOwner.body.title === "[TEST] Math Worksheet Updated", `Status: ${resUpdateOwner.status}`);

    // Update Resource by Non-Owner Educator 2 (403)
    const resUpdateNonOwner = await request("PUT", `/api/resources/${testResourceId}`, {
      title: "[TEST] Unauthorized Edit",
    }, edu2Token);
    recordTest("Resource", "Non-owner Educator updating resource returns 403 Forbidden", resUpdateNonOwner.status === 403, `Status: ${resUpdateNonOwner.status}`);

    // Update Resource by Admin (200)
    const resUpdateAdmin = await request("PUT", `/api/resources/${testResourceId}`, {
      title: "[TEST] Math Worksheet Admin Edit",
    }, adminToken);
    recordTest("Resource", "Admin can update any resource", resUpdateAdmin.status === 200, `Status: ${resUpdateAdmin.status}`);

    // Delete Resource by Student (403)
    const resDeleteStudent = await request("DELETE", `/api/resources/${testResourceId}`, null, studentToken);
    recordTest("Resource", "Student deleting resource returns 403 Forbidden", resDeleteStudent.status === 403, `Status: ${resDeleteStudent.status}`);

    // Delete Resource by Non-Owner Educator 2 (403)
    const resDeleteNonOwner = await request("DELETE", `/api/resources/${testResourceId}`, null, edu2Token);
    recordTest("Resource", "Non-owner Educator deleting resource returns 403 Forbidden", resDeleteNonOwner.status === 403, `Status: ${resDeleteNonOwner.status}`);

    // ----------------------------------------------------
    // 4. COLLABORATIVE FOLDER & PERMISSION TESTS
    // ----------------------------------------------------
    console.log("\n=== 4. Testing Collaborative Folders & Permissions ===");

    // Create Folder by Educator 1
    const folderCreateEdu = await request("POST", "/api/folders", {
      name: "[TEST] Science Collaboration Folder",
      description: "Shared worksheets for Grade 7 Science",
    }, edu1Token);
    recordTest("Folder", "Educator can create folder", folderCreateEdu.status === 201 && folderCreateEdu.body._id, `Status: ${folderCreateEdu.status}`);
    const testFolderId = folderCreateEdu.body._id;

    // Create Folder by Student (403)
    const folderCreateStudent = await request("POST", "/api/folders", {
      name: "[TEST] Student Folder",
    }, studentToken);
    recordTest("Folder", "Student creating folder returns 403 Forbidden", folderCreateStudent.status === 403, `Status: ${folderCreateStudent.status}`);

    // GET /api/folders (Educator 2 before sharing should NOT see it)
    const folderGetEdu2Before = await request("GET", `/api/folders/${testFolderId}`, null, edu2Token);
    recordTest("Folder", "Non-collaborator Educator accessing private folder returns 403 Forbidden", folderGetEdu2Before.status === 403, `Status: ${folderGetEdu2Before.status}`);

    // Admin can access any folder (200)
    const folderGetAdmin = await request("GET", `/api/folders/${testFolderId}`, null, adminToken);
    recordTest("Folder", "Admin can access any folder details", folderGetAdmin.status === 200, `Status: ${folderGetAdmin.status}`);

    // Share folder with Educator 2 (permission: "read")
    const folderShareRead = await request("POST", `/api/folders/${testFolderId}/share`, {
      email: "educator2@test-suite.org",
      permission: "read",
    }, edu1Token);
    recordTest("Folder", "Owner can share folder with read permission", folderShareRead.status === 200, `Status: ${folderShareRead.status}`);

    // Educator 2 can now view the shared folder (200, access: "read")
    const folderGetEdu2After = await request("GET", `/api/folders/${testFolderId}`, null, edu2Token);
    recordTest("Folder", "Read-collaborator can view shared folder", folderGetEdu2After.status === 200 && folderGetEdu2After.body.access === "read", `Access level: ${folderGetEdu2After.body?.access}`);

    // Read-Collaborator (Educator 2) trying to add resource to folder (403)
    const addResReadCollab = await request("POST", `/api/folders/${testFolderId}/resources`, {
      resourceId: testResourceId,
    }, edu2Token);
    recordTest("Folder", "Read-collaborator adding resource to folder returns 403 Forbidden", addResReadCollab.status === 403, `Status: ${addResReadCollab.status}`);

    // Upgrade Educator 2 permission to "write"
    const updatePermWrite = await request("PUT", `/api/folders/${testFolderId}/collaborators/${edu2User.id}/permission`, {
      permission: "write",
    }, edu1Token);
    recordTest("Folder", "Owner can upgrade collaborator permission to write", updatePermWrite.status === 200, `Status: ${updatePermWrite.status}`);

    // Write-Collaborator (Educator 2) adding resource to folder (200)
    const addResWriteCollab = await request("POST", `/api/folders/${testFolderId}/resources`, {
      resourceId: testResourceId,
    }, edu2Token);
    recordTest("Folder", "Write-collaborator can add resource to folder", addResWriteCollab.status === 200, `Status: ${addResWriteCollab.status}`);

    // Write-Collaborator Educator 2 can now update resource because they have folder write access! (200)
    const updateResViaFolderWrite = await request("PUT", `/api/resources/${testResourceId}`, {
      title: "[TEST] Math Worksheet Edited by Folder Writer",
    }, edu2Token);
    recordTest("Folder", "Write-collaborator can update resource via folder write permission", updateResViaFolderWrite.status === 200, `Status: ${updateResViaFolderWrite.status}`);

    // Write-Collaborator trying to delete folder (403 - Only owner can delete folder)
    const folderDeleteWriteCollab = await request("DELETE", `/api/folders/${testFolderId}`, null, edu2Token);
    recordTest("Folder", "Write-collaborator deleting folder returns 403 Forbidden", folderDeleteWriteCollab.status === 403, `Status: ${folderDeleteWriteCollab.status}`);

    // Write-Collaborator removing resource from folder (200)
    const removeResWriteCollab = await request("DELETE", `/api/folders/${testFolderId}/resources/${testResourceId}`, null, edu2Token);
    recordTest("Folder", "Write-collaborator can remove resource from folder", removeResWriteCollab.status === 200, `Status: ${removeResWriteCollab.status}`);

    // Owner removing collaborator Educator 2 (200)
    const removeCollab = await request("DELETE", `/api/folders/${testFolderId}/collaborators/${edu2User.id}`, null, edu1Token);
    recordTest("Folder", "Owner can remove collaborator from folder", removeCollab.status === 200, `Status: ${removeCollab.status}`);

    // ----------------------------------------------------
    // 5. NOTIFICATION & IN-APP MESSAGE TESTS
    // ----------------------------------------------------
    console.log("\n=== 5. Testing Notifications & Access Controls ===");

    // GET /api/notifications for Educator 2 (should have invite/removed notifications)
    const notifGetEdu2 = await request("GET", "/api/notifications", null, edu2Token);
    recordTest("Notification", "User can fetch their own notifications", notifGetEdu2.status === 200 && Array.isArray(notifGetEdu2.body), `Count: ${notifGetEdu2.body.length}`);
    const notifId = notifGetEdu2.body[0]?._id;

    // GET unread count
    const unreadCountRes = await request("GET", "/api/notifications/unread-count", null, edu2Token);
    recordTest("Notification", "GET unread count returns 200", unreadCountRes.status === 200 && typeof unreadCountRes.body.unreadCount === "number", `Unread: ${unreadCountRes.body.unreadCount}`);

    if (notifId) {
      // Educator 1 trying to mark Educator 2's notification as read (403)
      const badMarkRead = await request("PUT", `/api/notifications/${notifId}/read`, null, edu1Token);
      recordTest("Notification", "Marking another user's notification read returns 403 Forbidden", badMarkRead.status === 403, `Status: ${badMarkRead.status}`);

      // Educator 2 marking their own notification as read (200)
      const markReadRes = await request("PUT", `/api/notifications/${notifId}/read`, null, edu2Token);
      recordTest("Notification", "User can mark their own notification as read", markReadRes.status === 200 && markReadRes.body.read === true, `Status: ${markReadRes.status}`);

      // Educator 1 trying to delete Educator 2's notification (403)
      const badDeleteNotif = await request("DELETE", `/api/notifications/${notifId}`, null, edu1Token);
      recordTest("Notification", "Deleting another user's notification returns 403 Forbidden", badDeleteNotif.status === 403, `Status: ${badDeleteNotif.status}`);

      // Educator 2 deleting their own notification (200)
      const deleteNotifRes = await request("DELETE", `/api/notifications/${notifId}`, null, edu2Token);
      recordTest("Notification", "User can delete their own notification", deleteNotifRes.status === 200, `Status: ${deleteNotifRes.status}`);
    }

    // ----------------------------------------------------
    // 6. ANALYTICS & CSV EXPORT TESTS
    // ----------------------------------------------------
    console.log("\n=== 6. Testing Analytics & CSV Usage Reports ===");

    // GET /api/analytics/overview (Public / Optional Auth)
    const analyticsOverview = await request("GET", "/api/analytics/overview");
    recordTest("Analytics", "GET /api/analytics/overview is accessible and returns dashboard metrics", analyticsOverview.status === 200 && analyticsOverview.body.success === true, `Total Resources: ${analyticsOverview.body.totalResources}`);

    // GET /api/analytics/export-csv (CSV format)
    const analyticsCsv = await request("GET", "/api/analytics/export-csv");
    recordTest("Analytics", "GET /api/analytics/export-csv returns text/csv content", analyticsCsv.status === 200 && typeof analyticsCsv.body === "string" && analyticsCsv.body.includes("Resource ID"), `Status: ${analyticsCsv.status}`);

    // ----------------------------------------------------
    // 7. STUDENT MANAGEMENT MODULE TESTS
    // ----------------------------------------------------
    console.log("\n=== 7. Testing Student Management Module ===");

    // Create Student record by Educator 1 (201)
    const studentCreate = await request("POST", "/api/students", {
      name: "John Student",
      email: "john.student@test-suite.org",
      age: 14,
    }, edu1Token);
    recordTest("Student Module", "Educator can create Student record", studentCreate.status === 201 && studentCreate.body._id, `Status: ${studentCreate.status}`);
    const studentRecId = studentCreate.body._id;

    // Create Student record by Student role (403)
    const studentCreateForbidden = await request("POST", "/api/students", {
      name: "Forbidden Student",
      email: "forbidden@test-suite.org",
      age: 15,
    }, studentToken);
    recordTest("Student Module", "Student role creating Student record returns 403 Forbidden", studentCreateForbidden.status === 403, `Status: ${studentCreateForbidden.status}`);

    // Read Students by Educator 1 (200)
    const studentGetAll = await request("GET", "/api/students", null, edu1Token);
    recordTest("Student Module", "Educator can read Student records", studentGetAll.status === 200 && Array.isArray(studentGetAll.body), `Status: ${studentGetAll.status}`);

    // Read Students by Student role (403)
    const studentGetAllForbidden = await request("GET", "/api/students", null, studentToken);
    recordTest("Student Module", "Student role reading Student records returns 403 Forbidden", studentGetAllForbidden.status === 403, `Status: ${studentGetAllForbidden.status}`);

    if (studentRecId) {
      // Update Student record by Educator 1 (200)
      const studentUpdate = await request("PUT", `/api/students/${studentRecId}`, {
        name: "John Student Updated",
      }, edu1Token);
      recordTest("Student Module", "Educator can update Student record", studentUpdate.status === 200 && studentUpdate.body.name === "John Student Updated", `Status: ${studentUpdate.status}`);

      // Delete Student record by Educator 1 (200)
      const studentDelete = await request("DELETE", `/api/students/${studentRecId}`, null, edu1Token);
      recordTest("Student Module", "Educator can delete Student record", studentDelete.status === 200, `Status: ${studentDelete.status}`);
    }

    // ----------------------------------------------------
    // CLEANUP & SUMMARY
    // ----------------------------------------------------
    console.log("\n=== Clean Up & Test Execution Summary ===");
    await User.deleteMany({ email: /@test-suite\.org$/i });
    await Resource.deleteMany({ title: /^\[TEST\]/ });
    await Folder.deleteMany({ name: /^\[TEST\]/ });
    await Notification.deleteMany({ message: /\[TEST\]/ });
    await Student.deleteMany({ email: /@test-suite\.org$/i });

    const total = testResults.length;
    const passed = testResults.filter((t) => t.passed).length;
    const failed = total - passed;

    console.log(`\n========================================`);
    console.log(`TOTAL TESTS EXECUTED: ${total}`);
    console.log(`PASSED: ${passed} ✓`);
    console.log(`FAILED: ${failed} ❌`);
    console.log(`========================================\n`);

    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution fatal error:", err);
    if (server) server.close();
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
