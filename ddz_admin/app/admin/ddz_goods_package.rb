ActiveAdmin.register DdzGoodsPackage do

  permit_params do
    permitted = []
    permitted << :goodsName
    permitted << :goodsDesc
    permitted << :goodsType
    permitted << :goodsProps
    permitted << :sortIndex
    permitted
  end

  index do
    selectable_column
    id_column
    column :packageId
    column :packageName
    column :packageDesc
    column :packageType
    column :packageIcon
    column :price
    column :enabled
    column :sortIndex
    column :createAt
    column :updateAt
    actions
  end

  filter :packageId
  filter :packageName
  filter :packageDesc
  filter :packageType

  form do |f|
    f.inputs "DdzGoodsPackage Details" do
      f.input :packageId
      f.input :packageName
      f.input :packageDesc
      f.input :packageType
      f.input :packageIcon
      f.input :price
      f.input :enabled
      #f.input :goodsProps
      f.input :sortIndex
    end
    f.actions
  end

end
