import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvfmtdjzrjntmrvolajq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Zm10ZGp6cmpudG1ydm9sYWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjM3MDIsImV4cCI6MjA2OTE5OTcwMn0.lvjQ9336fbi309HZEar5ivER5HVd2TlfPOYTu1vh9pA';

export const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {
  private static instance: SupabaseService;

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  async registerUser(userData: {
    email: string;
    password: string;
    fullName: string;
    badgeNumber: string;
    rank: string;
    department: string;
    division: string;
    emergencyContact: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check if email already exists in our users table BEFORE creating auth user
      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingEmail) {
        return { success: false, error: 'User already exists' };
      }

      // Check if badge number already exists in our users table BEFORE creating auth user
      const { data: existingBadge } = await supabase
        .from('users')
        .select('badge_number')
        .eq('badge_number', userData.badgeNumber)
        .maybeSingle();

      if (existingBadge) {
        return { success: false, error: 'User already exists' };
      }

      // Use Supabase Auth for registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            badge_number: userData.badgeNumber,
            rank: userData.rank,
            department: userData.department,
            division: userData.division,
            emergency_contact: userData.emergencyContact
          }
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        if (authError.message.includes('already registered')) {
          return { success: false, error: 'User already exists' };
        }
        return { success: false, error: 'User already exists' };
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed' };
      }

      // Store additional user data in our users table
      const { data: userData2, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          password_hash: 'managed_by_supabase_auth',
          full_name: userData.fullName,
          badge_number: userData.badgeNumber,
          rank: userData.rank,
          department: userData.department,
          division: userData.division,
          emergency_contact: userData.emergencyContact
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return { success: false, error: 'Registration failed - please contact administrator' };
      }
      
      return { success: true, user: userData2 };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async loginUser(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Use Supabase Auth for login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Login error:', authError);
        return { success: false, error: 'Incorrect' };
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed' };
      }

      // Get additional user data from our users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !userData) {
        console.error('User data fetch error:', dbError);
        return { success: false, error: 'User data not found' };
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  getCurrentUser(): any {
    // Get current user from Supabase Auth
    return supabase.auth.getUser();
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async saveFIRDraft(formDataLocal: any, formDataEnglish: any, language: string, status: 'draft' | 'submitted' = 'draft'): Promise<string | null> {
    try {
      const caseId = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const { data, error } = await supabase
        .from('fir_drafts')
        .insert({
          case_id: caseId,
          status,
          form_data_local: formDataLocal,
          form_data_english: formDataEnglish,
          language
        })
        .select()
        .single();

      if (error) {
        console.error('FIR save error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase FIR save error:', error);
      return null;
    }
  }

  async getFIRDrafts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('fir_drafts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('FIR fetch error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Supabase FIR fetch error:', error);
      return [];
    }
  }

  async uploadEvidence(file: File, metadata: any): Promise<string | null> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Store metadata in database
      const { data: dbData, error: dbError } = await supabase
        .from('evidence_items')
        .insert({
          file_name: file.name,
          file_path: data.path,
          file_size: file.size,
          file_type: file.type,
          case_id: metadata.caseId || null,
          tags: metadata.tags || [],
          ai_analysis: metadata.aiAnalysis || null,
          status: 'verified'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // File was uploaded but metadata wasn't saved
        // You might want to delete the file or handle this case
      } else {
        console.log('Evidence uploaded and metadata saved successfully');
      }

      return data.path;
    } catch (error) {
      console.error('Supabase upload error:', error);
      return null;
    }
  }

  async getEvidenceItems(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('evidence_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Supabase fetch error:', error);
      return [];
    }
  }
}