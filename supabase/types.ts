export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          ai_input_snapshot: Json | null
          ai_output_snapshot: Json | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          human_override: boolean | null
          id: string
          override_reason: string | null
          project_id: string | null
          rationale: string | null
          risk_score: number | null
          suggested_billing_method: string | null
          suggested_contract_type: string | null
        }
        Insert: {
          ai_input_snapshot?: Json | null
          ai_output_snapshot?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          human_override?: boolean | null
          id?: string
          override_reason?: string | null
          project_id?: string | null
          rationale?: string | null
          risk_score?: number | null
          suggested_billing_method?: string | null
          suggested_contract_type?: string | null
        }
        Update: {
          ai_input_snapshot?: Json | null
          ai_output_snapshot?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          human_override?: boolean | null
          id?: string
          override_reason?: string | null
          project_id?: string | null
          rationale?: string | null
          risk_score?: number | null
          suggested_billing_method?: string | null
          suggested_contract_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          address: string | null
          created_at: string | null
          funding_source: string
          id: string
          is_historic: boolean | null
          name: string
          notes: string | null
          priority: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          funding_source: string
          id?: string
          is_historic?: boolean | null
          name: string
          notes?: string | null
          priority?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          funding_source?: string
          id?: string
          is_historic?: boolean | null
          name?: string
          notes?: string | null
          priority?: string | null
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          company: string
          created_at: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          primary_contact: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          primary_contact?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          primary_contact?: string | null
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          contact_id: string
          lead_id: string
        }
        Insert: {
          contact_id: string
          lead_id: string
        }
        Update: {
          contact_id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_projects: {
        Row: {
          contact_id: string
          project_id: string
        }
        Insert: {
          contact_id: string
          project_id: string
        }
        Update: {
          contact_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          campus_id: string | null
          client_portal_enabled: boolean | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_channel: string | null
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          campus_id?: string | null
          client_portal_enabled?: boolean | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_channel?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          campus_id?: string | null
          client_portal_enabled?: boolean | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_channel?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billing_method: string
          contract_type: string
          contract_value: number | null
          created_at: string | null
          created_by: string
          end_date: string | null
          fee_percentage: number | null
          id: string
          notes: string | null
          project_id: string
          retainage_percentage: number | null
          retainer_amount: number | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billing_method: string
          contract_type: string
          contract_value?: number | null
          created_at?: string | null
          created_by: string
          end_date?: string | null
          fee_percentage?: number | null
          id?: string
          notes?: string | null
          project_id: string
          retainage_percentage?: number | null
          retainer_amount?: number | null
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billing_method?: string
          contract_type?: string
          contract_value?: number | null
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          fee_percentage?: number | null
          id?: string
          notes?: string | null
          project_id?: string
          retainage_percentage?: number | null
          retainer_amount?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_ledger: {
        Row: {
          actual_amount: number | null
          category: string
          committed_amount: number | null
          contract_id: string | null
          description: string
          id: string
          invoice_reference: string | null
          project_id: string
          recorded_at: string | null
          recorded_by: string
          vendor_id: string | null
        }
        Insert: {
          actual_amount?: number | null
          category: string
          committed_amount?: number | null
          contract_id?: string | null
          description: string
          id?: string
          invoice_reference?: string | null
          project_id: string
          recorded_at?: string | null
          recorded_by: string
          vendor_id?: string | null
        }
        Update: {
          actual_amount?: number | null
          category?: string
          committed_amount?: number | null
          contract_id?: string | null
          description?: string
          id?: string
          invoice_reference?: string | null
          project_id?: string
          recorded_at?: string | null
          recorded_by?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_ledger_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          line_items: Json
          not_to_exceed: number | null
          notes: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          updated_at: string | null
          work_request_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          line_items?: Json
          not_to_exceed?: number | null
          notes?: string | null
          status?: string
          submitted_at?: string | null
          total_amount: number
          updated_at?: string | null
          work_request_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          line_items?: Json
          not_to_exceed?: number | null
          notes?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string | null
          work_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_work_request_id_fkey"
            columns: ["work_request_id"]
            isOneToOne: true
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      historic_artifacts: {
        Row: {
          artifact_type: string
          created_at: string | null
          description: string
          evidence_urls: string[] | null
          id: string
          project_id: string
          review_status: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          reviewer_required: boolean | null
          updated_at: string | null
          work_order_id: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string | null
          description: string
          evidence_urls?: string[] | null
          id?: string
          project_id: string
          review_status?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          reviewer_required?: boolean | null
          updated_at?: string | null
          work_order_id?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string | null
          description?: string
          evidence_urls?: string[] | null
          id?: string
          project_id?: string
          review_status?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          reviewer_required?: boolean | null
          updated_at?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historic_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historic_artifacts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      historic_docs: {
        Row: {
          architect_guidance: string | null
          compliance_notes: string | null
          created_at: string | null
          id: string
          materials_log: Json
          method_notes: string | null
          photos: Json
          updated_at: string | null
          work_request_id: string
        }
        Insert: {
          architect_guidance?: string | null
          compliance_notes?: string | null
          created_at?: string | null
          id?: string
          materials_log?: Json
          method_notes?: string | null
          photos?: Json
          updated_at?: string | null
          work_request_id: string
        }
        Update: {
          architect_guidance?: string | null
          compliance_notes?: string | null
          created_at?: string | null
          id?: string
          materials_log?: Json
          method_notes?: string | null
          photos?: Json
          updated_at?: string | null
          work_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historic_docs_work_request_id_fkey"
            columns: ["work_request_id"]
            isOneToOne: true
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campus_id: string
          created_at: string | null
          funding_source: string
          id: string
          invoice_number: string
          line_items: Json
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          work_request_ids: string[]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campus_id: string
          created_at?: string | null
          funding_source: string
          id?: string
          invoice_number: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          submitted_at?: string | null
          total_amount: number
          work_request_ids?: string[]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campus_id?: string
          created_at?: string | null
          funding_source?: string
          id?: string
          invoice_number?: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          work_request_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_intake_records: {
        Row: {
          captured_at: string | null
          created_at: string | null
          decision: Json
          form_snapshot: Json
          id: string
          lead_id: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          decision: Json
          form_snapshot: Json
          id?: string
          lead_id: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          decision?: Json
          form_snapshot?: Json
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_intake_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campus_id: string | null
          company_name: string
          contact_name: string
          created_at: string | null
          email: string
          estimated_value: number | null
          id: string
          intake_metadata: Json | null
          next_step: string | null
          notes: string | null
          phone: string | null
          project_id: string | null
          source: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          campus_id?: string | null
          company_name: string
          contact_name: string
          created_at?: string | null
          email: string
          estimated_value?: number | null
          id?: string
          intake_metadata?: Json | null
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          source: string
          stage?: string
          updated_at?: string | null
        }
        Update: {
          campus_id?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string | null
          email?: string
          estimated_value?: number | null
          id?: string
          intake_metadata?: Json | null
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          source?: string
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          description: string | null
          id: string
          invoiced_invoice_id: string | null
          name: string
          paid_at: string | null
          ready_to_bill_at: string | null
          scheduled_date: string | null
          status: string
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          invoiced_invoice_id?: string | null
          name: string
          paid_at?: string | null
          ready_to_bill_at?: string | null
          scheduled_date?: string | null
          status?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          invoiced_invoice_id?: string | null
          name?: string
          paid_at?: string | null
          ready_to_bill_at?: string | null
          scheduled_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_inspections: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          id: string
          inspection_type: string
          inspector_notes: string | null
          permit_id: string
          result: string | null
          scheduled_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          id?: string
          inspection_type: string
          inspector_notes?: string | null
          permit_id: string
          result?: string | null
          scheduled_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          id?: string
          inspection_type?: string
          inspector_notes?: string | null
          permit_id?: string
          result?: string | null
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_inspections_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          approval_date: string | null
          attachments: string[] | null
          code_set: string | null
          code_version: string | null
          created_at: string | null
          expiration_date: string | null
          fees: Json | null
          id: string
          jurisdiction_name: string | null
          jurisdiction_type: string | null
          notes: string | null
          permit_type: string
          project_id: string
          reviewer_authority: string | null
          reviewer_contact: string | null
          status: string
          submission_date: string | null
          updated_at: string | null
          work_order_id: string | null
        }
        Insert: {
          approval_date?: string | null
          attachments?: string[] | null
          code_set?: string | null
          code_version?: string | null
          created_at?: string | null
          expiration_date?: string | null
          fees?: Json | null
          id?: string
          jurisdiction_name?: string | null
          jurisdiction_type?: string | null
          notes?: string | null
          permit_type: string
          project_id: string
          reviewer_authority?: string | null
          reviewer_contact?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
          work_order_id?: string | null
        }
        Update: {
          approval_date?: string | null
          attachments?: string[] | null
          code_set?: string | null
          code_version?: string | null
          created_at?: string | null
          expiration_date?: string | null
          fees?: Json | null
          id?: string
          jurisdiction_name?: string | null
          jurisdiction_type?: string | null
          notes?: string | null
          permit_type?: string
          project_id?: string
          reviewer_authority?: string | null
          reviewer_contact?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permits_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_snapshots: {
        Row: {
          contingency: number | null
          contingency_notes: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          direct_cost: number
          gross_profit: number | null
          id: string
          labor_rate_snapshot: Json | null
          overhead_allocated: number | null
          overhead_rate_snapshot: Json | null
          pricing_version: string | null
          project_id: string
          projected_margin: number | null
          risk_score: number | null
          suggested_contract_type: string | null
        }
        Insert: {
          contingency?: number | null
          contingency_notes?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direct_cost: number
          gross_profit?: number | null
          id?: string
          labor_rate_snapshot?: Json | null
          overhead_allocated?: number | null
          overhead_rate_snapshot?: Json | null
          pricing_version?: string | null
          project_id: string
          projected_margin?: number | null
          risk_score?: number | null
          suggested_contract_type?: string | null
        }
        Update: {
          contingency?: number | null
          contingency_notes?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direct_cost?: number
          gross_profit?: number | null
          id?: string
          labor_rate_snapshot?: Json | null
          overhead_allocated?: number | null
          overhead_rate_snapshot?: Json | null
          pricing_version?: string | null
          project_id?: string
          projected_margin?: number | null
          risk_score?: number | null
          suggested_contract_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_snapshots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          campus_id: string
          client_email: string | null
          client_logo: string | null
          client_name: string
          client_phone: string | null
          client_summary: string | null
          created_at: string | null
          end_date: string | null
          id: string
          internal_notes: string | null
          internal_owner_id: string
          name: string
          prime_vendor_id: string | null
          share_token: string | null
          show_budget: boolean | null
          show_contacts: boolean | null
          show_invoices: boolean | null
          show_timeline: boolean | null
          site_id: string
          spent_budget: number | null
          start_date: string | null
          status: string
          total_budget: number | null
          updated_at: string | null
          walkthrough_notes: string | null
        }
        Insert: {
          campus_id: string
          client_email?: string | null
          client_logo?: string | null
          client_name: string
          client_phone?: string | null
          client_summary?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          internal_owner_id: string
          name: string
          prime_vendor_id?: string | null
          share_token?: string | null
          show_budget?: boolean | null
          show_contacts?: boolean | null
          show_invoices?: boolean | null
          show_timeline?: boolean | null
          site_id: string
          spent_budget?: number | null
          start_date?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string | null
          walkthrough_notes?: string | null
        }
        Update: {
          campus_id?: string
          client_email?: string | null
          client_logo?: string | null
          client_name?: string
          client_phone?: string | null
          client_summary?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          internal_owner_id?: string
          name?: string
          prime_vendor_id?: string | null
          share_token?: string | null
          show_budget?: boolean | null
          show_contacts?: boolean | null
          show_invoices?: boolean | null
          show_timeline?: boolean | null
          site_id?: string
          spent_budget?: number | null
          start_date?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string | null
          walkthrough_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          approved_at: string | null
          approved_by_id: string | null
          created_at: string | null
          funding_code: string | null
          id: string
          line_items: Json
          not_to_exceed: number | null
          notes: string | null
          status: string
          submitted_at: string | null
          total_estimate: number
          version: number | null
          work_order_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string | null
          funding_code?: string | null
          id?: string
          line_items?: Json
          not_to_exceed?: number | null
          notes?: string | null
          status?: string
          submitted_at?: string | null
          total_estimate?: number
          version?: number | null
          work_order_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string | null
          funding_code?: string | null
          id?: string
          line_items?: Json
          not_to_exceed?: number | null
          notes?: string | null
          status?: string
          submitted_at?: string | null
          total_estimate?: number
          version?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_of_values: {
        Row: {
          amount_earned: number | null
          budget_amount: number
          contract_id: string
          created_at: string | null
          id: string
          last_updated: string | null
          line_item: string
          percent_complete: number | null
        }
        Insert: {
          amount_earned?: number | null
          budget_amount: number
          contract_id: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          line_item: string
          percent_complete?: number | null
        }
        Update: {
          amount_earned?: number | null
          budget_amount?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          line_item?: string
          percent_complete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_of_values_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          milestones: Json
          start_date: string
          updated_at: string | null
          work_request_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          milestones?: Json
          start_date: string
          updated_at?: string | null
          work_request_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          milestones?: Json
          start_date?: string
          updated_at?: string | null
          work_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_work_request_id_fkey"
            columns: ["work_request_id"]
            isOneToOne: true
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      site_walkthroughs: {
        Row: {
          campus_id: string
          completed_date: string | null
          created_at: string | null
          findings: Json | null
          id: string
          notes: string | null
          priority_list: Json | null
          scheduled_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          campus_id: string
          completed_date?: string | null
          created_at?: string | null
          findings?: Json | null
          id?: string
          notes?: string | null
          priority_list?: Json | null
          scheduled_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          campus_id?: string
          completed_date?: string | null
          created_at?: string | null
          findings?: Json | null
          id?: string
          notes?: string | null
          priority_list?: Json | null
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_walkthroughs_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string
          campus_id: string
          created_at: string | null
          historic_notes: string | null
          id: string
          is_historic: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address: string
          campus_id: string
          created_at?: string | null
          historic_notes?: string | null
          id?: string
          is_historic?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          campus_id?: string
          created_at?: string | null
          historic_notes?: string | null
          id?: string
          is_historic?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campuses: {
        Row: {
          campus_id: string
          user_id: string
        }
        Insert: {
          campus_id: string
          user_id: string
        }
        Update: {
          campus_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campuses_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_campuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          access_granted: string
          created_at: string | null
          department: string | null
          full_name: string | null
          notes: string | null
          requested_access: string
          role_title: string | null
          status: string
          team_size: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_granted?: string
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          notes?: string | null
          requested_access?: string
          role_title?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_granted?: string
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          notes?: string | null
          requested_access?: string
          role_title?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      walkthrough_sessions: {
        Row: {
          ai_plan: Json | null
          attachments: string[] | null
          campus_id: string | null
          created_at: string | null
          finalized_plan: Json | null
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string | null
          responses: Json | null
          scheduled_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_plan?: Json | null
          attachments?: string[] | null
          campus_id?: string | null
          created_at?: string | null
          finalized_plan?: Json | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          responses?: Json | null
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_plan?: Json | null
          attachments?: string[] | null
          campus_id?: string | null
          created_at?: string | null
          finalized_plan?: Json | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          responses?: Json | null
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walkthrough_sessions_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkthrough_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkthrough_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_updates: {
        Row: {
          blockers: string | null
          client_needs: string | null
          created_at: string | null
          created_by: string
          id: string
          next_steps: string
          progress: string
          week_of: string
          work_request_id: string
        }
        Insert: {
          blockers?: string | null
          client_needs?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          next_steps: string
          progress: string
          week_of: string
          work_request_id: string
        }
        Update: {
          blockers?: string | null
          client_needs?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          next_steps?: string
          progress?: string
          week_of?: string
          work_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_updates_work_request_id_fkey"
            columns: ["work_request_id"]
            isOneToOne: false
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          approved_quote_id: string | null
          assigned_vendor_id: string | null
          category: string
          completion_checklist_done: boolean | null
          completion_photo_urls: string[] | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          historic_compliance: Json | null
          id: string
          location_detail: string | null
          percent_complete: number | null
          priority: string | null
          project_id: string
          request_number: string
          requested_by_id: string | null
          requested_date: string | null
          site_id: string
          status: string
          target_end_date: string | null
          target_start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_quote_id?: string | null
          assigned_vendor_id?: string | null
          category: string
          completion_checklist_done?: boolean | null
          completion_photo_urls?: string[] | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          historic_compliance?: Json | null
          id?: string
          location_detail?: string | null
          percent_complete?: number | null
          priority?: string | null
          project_id: string
          request_number: string
          requested_by_id?: string | null
          requested_date?: string | null
          site_id: string
          status?: string
          target_end_date?: string | null
          target_start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_quote_id?: string | null
          assigned_vendor_id?: string | null
          category?: string
          completion_checklist_done?: boolean | null
          completion_photo_urls?: string[] | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          historic_compliance?: Json | null
          id?: string
          location_detail?: string | null
          percent_complete?: number | null
          priority?: string | null
          project_id?: string
          request_number?: string
          requested_by_id?: string | null
          requested_date?: string | null
          site_id?: string
          status?: string
          target_end_date?: string | null
          target_start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      work_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campus_id: string
          category: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string
          estimated_cost: number | null
          id: string
          is_historic: boolean | null
          priority: string | null
          property: string
          request_number: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campus_id: string
          category: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          estimated_cost?: number | null
          id?: string
          is_historic?: boolean | null
          priority?: string | null
          property: string
          request_number: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campus_id?: string
          category?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          estimated_cost?: number | null
          id?: string
          is_historic?: boolean | null
          priority?: string | null
          property?: string
          request_number?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_requests_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      generate_work_request_number: { Args: never; Returns: string }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
