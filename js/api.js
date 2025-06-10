// Singleton Pattern
const ApiSingleton = (function() {
    let instance;
    
    function createInstance() {
        // Private variables and methods
        const API_BASE_URL = 'http://localhost:8080/api';
        
        // Public methods
        return {
            // Authentication API calls
            auth: {
                async login(email, password) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ email, password })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            return { 
                                success: false, 
                                message: errorData.message || 'Login failed'
                            };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Login error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
            
                async register(name, email, password) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ name, email, password })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            return { 
                                success: false, 
                                message: errorData.message || 'Registration failed'
                            };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Registration error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
            
                async logout() {
                    try {
                        const response = await fetch(`${API_BASE_URL}/logout`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { success: false, message: 'Logout failed' };
                        }
                        
                        return { success: true };
                    } catch (error) {
                        console.error('Logout error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
            
                async checkAuth() {
                    try {
                        const response = await fetch(`${API_BASE_URL}/check-auth`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { isAuthenticated: false };
                        }
                        
                        return { isAuthenticated: true, ...await response.json() };
                    } catch (error) {
                        console.error('Auth check error:', error);
                        return { isAuthenticated: false };
                    }
                }
            },
            
            // Items API calls - using Command Pattern
            items: {
                async createLostItem(itemData) {
                    return this._createItem({...itemData, type: 'LOST'});
                },
                
                async createFoundItem(itemData) {
                    return this._createItem({...itemData, type: 'FOUND'});
                },
            
                async _createItem(itemData) {
                    try {
                        console.log('API._createItem called with data:', JSON.stringify(itemData, null, 2));
                        
                        // Make sure we have a 'name' field, fall back to 'title' if needed
                        if (!itemData.name && itemData.title) {
                            itemData.name = itemData.title;
                            console.log('Setting name from title field');
                        }
                        
                        // Make sure we have a valid type field
                        if (!itemData.type) {
                            console.error('No type specified for item, defaulting to LOST');
                            itemData.type = 'LOST';
                        }
                        
                        const endpoint = itemData.type === 'LOST' 
                            ? `${API_BASE_URL}/lost-items` 
                            : `${API_BASE_URL}/found-items`;
                        
                        console.log(`Sending request to ${endpoint}`);
                        
                        // Create a modifiable copy to avoid mutating the original
                        const dataToSend = { ...itemData };
                        
                        // Log the exact data being sent
                        console.log('Request payload:', JSON.stringify(dataToSend, null, 2));
                            
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify(dataToSend)
                        });
                        
                        console.log('Response status:', response.status);
                        
                        if (!response.ok) {
                            let errorMessage = 'Failed to create item';
                            try {
                                const errorData = await response.json();
                                console.error('Error response:', errorData);
                                errorMessage = errorData.message || errorMessage;
                            } catch (jsonError) {
                                console.error('Failed to parse error response:', jsonError);
                                try {
                                    errorMessage = await response.text() || errorMessage;
                                } catch (textError) {
                                    console.error('Failed to read error response text:', textError);
                                }
                            }
                            
                            return { 
                                success: false, 
                                message: errorMessage
                            };
                        }
                        
                        const responseData = await response.json();
                        console.log('Success response:', responseData);
                        return { success: true, data: responseData };
                    } catch (error) {
                        console.error('Create item error:', error);
                        return { success: false, message: 'Network error occurred: ' + error.message };
                    }
                },
            
                async getLostItems(category = null, location = null) {
                    return this._getItems('LOST', category, location);
                },
                
                async getFoundItems(category = null, location = null) {
                    return this._getItems('FOUND', category, location);
                },
            
                async _getItems(type, category = null, location = null) {
                    try {
                        const endpoint = type === 'LOST' 
                            ? `${API_BASE_URL}/lost-items` 
                            : `${API_BASE_URL}/found-items`;
                            
                        let url = endpoint;
                        const params = new URLSearchParams();
                        if (category) params.append('category', category);
                        if (location) params.append('location', location);
                        if (params.toString()) url += `?${params.toString()}`;
                
                        const response = await fetch(url, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return [];
                        }
                        
                        return await response.json();
                    } catch (error) {
                        console.error(`Get ${type} items error:`, error);
                        return [];
                    }
                },
            
                async getItemById(id, type) {
                    try {
                        const endpoint = type === 'LOST' 
                            ? `${API_BASE_URL}/lost-items/${id}` 
                            : `${API_BASE_URL}/found-items/${id}`;
                            
                        const response = await fetch(endpoint, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return null;
                        }
                        
                        return await response.json();
                    } catch (error) {
                        console.error('Get item by id error:', error);
                        return null;
                    }
                },
            
                async getUserItems() {
                    try {
                        const response = await fetch(`${API_BASE_URL}/dashboard/items`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { lost: [], found: [] };
                        }
                        
                        return await response.json();
                    } catch (error) {
                        console.error('Get user items error:', error);
                        return { lost: [], found: [] };
                    }
                },
                
                async createClaim(itemId, claimData) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/claims`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                itemId,
                                ...claimData
                            })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            return { 
                                success: false, 
                                message: errorData.message || 'Failed to create claim'
                            };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Create claim error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
                
                async uploadImage(file) {
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        const response = await fetch(`${API_BASE_URL}/upload`, {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { success: false, message: 'Failed to upload image' };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Upload image error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                }
            }
        };
    }
    
    return {
        // Public method to get the Singleton instance
        getInstance: function() {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

// Export the API instances
const API = ApiSingleton.getInstance();
const authAPI = API.auth;
const itemsAPI = API.items; 