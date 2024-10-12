public with sharing class UserPermissionData {
    public class UserInfo {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String profileName { get; set; }
        @AuraEnabled public String roleName { get; set; } // Added role name
        @AuraEnabled public List<String> permissionSetNames { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<UserInfo> getActiveUsers() {
        List<UserInfo> userList = new List<UserInfo>();

        // Query to get active users with their profile, role, and permission sets
        List<User> users = [
            SELECT Id, Name, Profile.Name, UserRole.Name, 
                   (SELECT PermissionSet.Name FROM PermissionSetAssignments) 
            FROM User 
            WHERE IsActive = TRUE
        ];

        for (User u : users) {
            UserInfo userInfo = new UserInfo();
            userInfo.id = u.Id;
            userInfo.name = u.Name;
            userInfo.profileName = u.Profile.Name;
            userInfo.roleName = u.UserRole != null ? u.UserRole.Name : 'No Role Assigned'; // Assign role name

            // Populate permission set names
            List<String> permSetNames = new List<String>();
            for (PermissionSetAssignment psa : u.PermissionSetAssignments) {
                permSetNames.add(psa.PermissionSet.Name);
            }
            userInfo.permissionSetNames = permSetNames;

            userList.add(userInfo);
        }

        return userList;
    }
}