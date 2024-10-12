import { LightningElement, track } from 'lwc';
import getActiveUsers from '@salesforce/apex/UserPermissionData.getActiveUsers';

export default class UserPermissionData extends LightningElement {
    @track activeUsers = [];
    @track filteredUsers = [];
    @track error;
    @track isLoading = true;
    @track searchKey = '';
    @track sortedBy = 'name';
    @track sortedDirection = 'asc';
    @track page = 1; 
    @track pageSize = 8; 
    @track totalRecountCount = 0;
    @track totalPage = 0; 
    @track data = []; 
    @track profileCounts = [];
    @track roleCounts = [];

    // Define the columns for the user datatable
    columns = [
        { label: 'Name', fieldName: 'name', sortable: true },
        { label: 'Profile', fieldName: 'profileName', sortable: true },
        { label: 'Role', fieldName: 'roleName', sortable: true },
        {
            label: 'Permission Sets',
            fieldName: 'formattedPermissionSets',
            type: 'text',
            sortable: false,
        }
    ];

    // Define the columns for the profile counts table
    profileColumns = [
        { label: 'Profile Name', fieldName: 'name', type: 'text' },
        { label: 'Count', fieldName: 'count', type: 'number' }
    ];

    // Define the columns for the role counts table
    roleColumns = [
        { label: 'Role Name', fieldName: 'name', type: 'text' },
        { label: 'Count', fieldName: 'count', type: 'number' }
    ];

    connectedCallback() {
        this.loadActiveUsers();
    }

    loadActiveUsers() {
        console.log('Loading active users...');
        getActiveUsers()
            .then(result => {
                console.log('Active users retrieved:', result);
                this.activeUsers = result.map(user => {
                    return {
                        ...user,
                        formattedPermissionSets: user.permissionSetNames.length > 0 
                            ? user.permissionSetNames.join(', ')
                            : 'None',
                    };
                });
                this.filteredUsers = [...this.activeUsers];
                this.totalRecountCount = this.filteredUsers.length;
                this.calculateProfileAndRoleCounts();
                this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
                this.displayRecordPerPage(this.page);
                this.isLoading = false;
            })
            .catch(error => {
                this.error = error.body.message;
                console.error('Error retrieving active users:', this.error);
                this.isLoading = false;
            });
    }

    calculateProfileAndRoleCounts() {
        const profileMap = new Map();
        const roleMap = new Map();

        this.filteredUsers.forEach(user => {
            // Count Profiles
            if (profileMap.has(user.profileName)) {
                profileMap.set(user.profileName, profileMap.get(user.profileName) + 1);
            } else {
                profileMap.set(user.profileName, 1);
            }

            // Count Roles
            if (roleMap.has(user.roleName)) {
                roleMap.set(user.roleName, roleMap.get(user.roleName) + 1);
            } else {
                roleMap.set(user.roleName, 1);
            }
        });

        this.profileCounts = Array.from(profileMap, ([name, count]) => ({ id: name, name, count }));
        this.roleCounts = Array.from(roleMap, ([name, count]) => ({ id: name, name, count }));
    }

    displayRecordPerPage(page) {
        const startingRecord = (page - 1) * this.pageSize;
        this.data = this.filteredUsers.slice(startingRecord, startingRecord + this.pageSize);
    }

    previousHandler() {
        if (this.page > 1) {
            this.page--;
            this.displayRecordPerPage(this.page);
        }
    }

    nextHandler() {
        if (this.page < this.totalPage) {
            this.page++;
            this.displayRecordPerPage(this.page);
        }
    }

    sortColumns(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        this.filteredUsers.sort((a, b) => {
            let fieldA = a[this.sortedBy] ? a[this.sortedBy].toLowerCase() : '';
            let fieldB = b[this.sortedBy] ? b[this.sortedBy].toLowerCase() : '';
            return this.sortedDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        });

        this.displayRecordPerPage(this.page);
    }

    handleKeyChange(event) {
        this.searchKey = event.target.value.toLowerCase();

        this.filteredUsers = this.activeUsers.filter(user => {
            const userName = user.name ? user.name.toLowerCase() : '';
            const profileName = user.profileName ? user.profileName.toLowerCase() : '';
            const roleName = user.roleName ? user.roleName.toLowerCase() : '';
            return userName.includes(this.searchKey) || profileName.includes(this.searchKey) || roleName.includes(this.searchKey);
        });

        this.totalRecountCount = this.filteredUsers.length; 
        this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
        this.page = 1; 
        this.displayRecordPerPage(this.page);
        this.calculateProfileAndRoleCounts(); // Update counts based on search results
    }
}