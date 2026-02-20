"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function HalalApplyFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const preselectedBusinessId = (location.state as any)?.businessId;
  const editApplicationId = id || (location.state as any)?.applicationId;
  const isEdit = !!editApplicationId;

  const [businessId, setBusinessId] = useState(preselectedBusinessId || "");
  const [productList, setProductList] = useState<{ name: string; description?: string }[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "" });
  const [ingredientList, setIngredientList] = useState<{ name: string; source?: string; halalStatus?: string }[]>([]);
  const [newIngredient, setNewIngredient] = useState({ name: "", source: "", halalStatus: "" });

  const { data: existingApp, isLoading: loadingApp } = useQuery({
    queryKey: ["halal-application", editApplicationId],
    queryFn: () => halalApi.applications.get(editApplicationId!),
    enabled: isEdit && !!editApplicationId,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ["halal-applications"],
    queryFn: () => halalApi.applications.list({ limit: 100 }),
  });
  const applications = applicationsData?.items ?? [];

  const { data: businessesData } = useQuery({
    queryKey: ["halal-businesses"],
    queryFn: () => halalApi.businesses.list({ limit: 100 }),
  });
  const businesses = businessesData?.items ?? [];

  const businessIdsWithActiveApp = useMemo(() => {
    return new Set(
      applications
        .filter((a) => a.status !== "REJECTED")
        .map((a) => a.businessId)
    );
  }, [applications]);

  const eligibleBusinesses = useMemo(() => {
    return businesses.filter(
      (b) =>
        !businessIdsWithActiveApp.has(b.id) ||
        (editApplicationId && b.id === existingApp?.businessId)
    );
  }, [businesses, businessIdsWithActiveApp, editApplicationId, existingApp?.businessId]);

  useEffect(() => {
    if (existingApp && editApplicationId) {
      if (existingApp.status !== "DRAFT") {
        toast.error("Only draft applications can be edited");
        navigate("/halal/applications/" + editApplicationId, { replace: true });
        return;
      }
      setBusinessId(existingApp.businessId);
      setProductList(
        (existingApp.productList || []).map((p: any) => ({
          name: p.name || "",
          description: p.description,
        }))
      );
      setIngredientList(
        (existingApp.ingredients || []).map((i: any) => ({
          name: i.name || "",
          source: i.source,
          halalStatus: i.halalStatus,
        }))
      );
    } else if (preselectedBusinessId) {
      setBusinessId(preselectedBusinessId);
    }
  }, [existingApp, editApplicationId, preselectedBusinessId, navigate]);

  const createMutation = useMutation({
    mutationFn: halalApi.applications.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application created");
      navigate("/halal/applications/" + data.id);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { productList?: any; ingredients?: any }) =>
      halalApi.applications.update(editApplicationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      queryClient.invalidateQueries({ queryKey: ["halal-application", editApplicationId] });
      toast.success("Application updated");
      navigate("/halal/applications/" + editApplicationId);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to update"),
  });

  const addProduct = () => {
    if (!newProduct.name.trim()) return;
    setProductList((p) => [...p, { name: newProduct.name, description: newProduct.description || undefined }]);
    setNewProduct({ name: "", description: "" });
  };
  const removeProduct = (i: number) => setProductList((p) => p.filter((_, idx) => idx !== i));

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    setIngredientList((p) => [
      ...p,
      { name: newIngredient.name, source: newIngredient.source || undefined, halalStatus: newIngredient.halalStatus || undefined },
    ]);
    setNewIngredient({ name: "", source: "", halalStatus: "" });
  };
  const removeIngredient = (i: number) => setIngredientList((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId && !isEdit) {
      toast.error("Select a business");
      return;
    }
    if (!isEdit && businessIdsWithActiveApp.has(businessId)) {
      toast.error("This business already has an active application");
      return;
    }
    const payload = {
      productList: productList.length > 0 ? productList : undefined,
      ingredients: ingredientList.length > 0 ? ingredientList : undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate({ businessId, ...payload });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingApp) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/halal/apply")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {isEdit ? "Edit Application" : "New Application"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit ? "Update products and ingredients" : "Apply for Halal certification"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update products and ingredients"
              : "Select a business and add products/ingredients (one application per business)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Business *</Label>
              <Select
                value={businessId}
                onValueChange={setBusinessId}
                required={!isEdit}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleBusinesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.category.replace("_", " ")})
                    </SelectItem>
                  ))}
                  {eligibleBusinesses.length === 0 && !isEdit && (
                    <SelectItem value="_none" disabled>
                      No businesses available (all have active applications)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!isEdit && businesses.length > 0 && eligibleBusinesses.length === 0 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Each business can have only one active application at a time.
                </p>
              )}
            </div>

            <div>
              <Label>Products</Label>
              <div className="space-y-2">
                {productList.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 font-medium">{p.name}</span>
                    {p.description ? (
                      <span className="text-sm text-muted-foreground max-sm:hidden">{p.description}</span>
                    ) : null}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                    className="sm:min-w-[140px]"
                  />
                  <Button type="button" variant="outline" onClick={addProduct}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Ingredients</Label>
              <div className="space-y-2">
                {ingredientList.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 font-medium">{p.name}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <Input
                    placeholder="Ingredient name"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, name: e.target.value }))}
                    className="sm:min-w-[120px]"
                  />
                  <Input
                    placeholder="Source"
                    value={newIngredient.source}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, source: e.target.value }))}
                  />
                  <Input
                    placeholder="Halal status"
                    value={newIngredient.halalStatus}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, halalStatus: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={addIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/halal/apply")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || (!isEdit && eligibleBusinesses.length === 0)}>
                {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create Application (Draft)"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
