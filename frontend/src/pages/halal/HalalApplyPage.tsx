"use client";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function HalalApplyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const preselectedBusinessId = (location.state as any)?.businessId;

  const [businessId, setBusinessId] = useState(preselectedBusinessId || "");
  const [productList, setProductList] = useState<{ name: string; description?: string }[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "" });
  const [ingredientList, setIngredientList] = useState<{ name: string; source?: string; halalStatus?: string }[]>([]);
  const [newIngredient, setNewIngredient] = useState({ name: "", source: "", halalStatus: "" });

  const { data: businesses } = useQuery({
    queryKey: ["halal-businesses"],
    queryFn: () => halalApi.businesses.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: halalApi.applications.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application created");
      navigate("/halal/dashboard");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create"),
  });

  const addProduct = () => {
    if (!newProduct.name.trim()) return;
    setProductList((p) => [...p, { name: newProduct.name, description: newProduct.description || undefined }]);
    setNewProduct({ name: "", description: "" });
  };
  const removeProduct = (i: number) => setProductList((p) => p.filter((_, idx) => idx !== i));

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    setIngredientList((p) => [...p, { name: newIngredient.name, source: newIngredient.source || undefined, halalStatus: newIngredient.halalStatus || undefined }]);
    setNewIngredient({ name: "", source: "", halalStatus: "" });
  };
  const removeIngredient = (i: number) => setIngredientList((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error("Select a business");
      return;
    }
    createMutation.mutate({
      businessId,
      productList: productList.length > 0 ? productList : undefined,
      ingredients: ingredientList.length > 0 ? ingredientList : undefined,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Application</h1>
          <p className="text-muted-foreground text-sm">Apply for Halal certification</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>Select business and add products/ingredients</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Business *</Label>
              <Select value={businessId} onValueChange={setBusinessId} required>
                <SelectTrigger><SelectValue placeholder="Select business" /></SelectTrigger>
                <SelectContent>
                  {businesses?.items?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.category})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Products</Label>
              <div className="space-y-2">
                {productList.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 font-medium">{p.name}</span>
                    {p.description && <span className="text-sm text-muted-foreground">{p.description}</span>}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={addProduct}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Ingredients</Label>
              <div className="space-y-2">
                {ingredientList.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 font-medium">{p.name}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Ingredient name"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, name: e.target.value }))}
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
                  <Button type="button" variant="outline" onClick={addIngredient}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/halal/dashboard")}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Application (Draft)"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
