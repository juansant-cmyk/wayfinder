import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { formatDateRange, formatNights } from "./mapPlan";
import { tripDestinationIcon } from "./tripIcons";

const COLORS = {
  text: "#10213B",
  subtext: "#51607D",
  blue: "#1F78FF",
  coral: "#FF5A4E",
  green: "#149647",
  sheet: "#FFFFFF",
  muted: "#EEF3FB",
};

function renderIcon(library, name, color, size) {
  if (library === "material") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

function planSubtitle(plan) {
  const dates = formatDateRange(plan.start_date, plan.end_date);
  const nights = formatNights(plan.nights);
  return [dates, nights].filter(Boolean).join(" · ") || "Dates TBD";
}

function ShadePressable({ style, children, ...rest }) {
  return (
    <Pressable
      style={(state) => {
        const resolved = typeof style === "function" ? style(state) : style;
        return [styles.shadePressable, resolved];
      }}
      {...rest}
    >
      {(state) => (
        <>
          {children}
          {state.hovered || state.pressed ? (
            <View pointerEvents="none" style={styles.shadeOverlay} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

function TripRowActions({ isPast, onComplete, onReopen, onDelete }) {
  return (
    <View style={styles.swipeActions}>
      {isPast ? (
        <ShadePressable
          accessibilityRole="button"
          accessibilityLabel="Reopen trip"
          onPress={onReopen}
          style={[styles.swipeAction, styles.swipeReopen]}
        >
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>Reopen</Text>
        </ShadePressable>
      ) : (
        <ShadePressable
          accessibilityRole="button"
          accessibilityLabel="Mark trip complete"
          onPress={onComplete}
          style={[styles.swipeAction, styles.swipeComplete]}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>Complete</Text>
        </ShadePressable>
      )}
      <ShadePressable
        accessibilityRole="button"
        accessibilityLabel="Delete trip"
        onPress={onDelete}
        style={[styles.swipeAction, styles.swipeDelete]}
      >
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Delete</Text>
      </ShadePressable>
    </View>
  );
}

function TripRow({
  plan,
  selected,
  isPast,
  useMenu,
  onSelect,
  onOpenMenu,
  onComplete,
  onReopen,
  onDelete,
}) {
  const icon = tripDestinationIcon(plan.destination_name, plan.title);

  const rowBody = (
    <View style={[styles.row, selected && styles.rowSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${plan.title}`}
        onPress={onSelect}
        style={styles.rowMain}
      >
        {plan.cover_image_url ? (
          <Image source={{ uri: plan.cover_image_url }} style={styles.coverThumb} />
        ) : (
          <View style={[styles.iconBadge, { backgroundColor: icon.background }]}>
            {renderIcon(icon.iconLibrary, icon.iconName, icon.color, 20)}
          </View>
        )}
        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {plan.title}
          </Text>
          <Text numberOfLines={1} style={styles.rowSubtitle}>
            {planSubtitle(plan)}
          </Text>
        </View>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={COLORS.blue} /> : null}
      </Pressable>
      {useMenu ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Manage ${plan.title}`}
          hitSlop={8}
          onPress={onOpenMenu}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} />
        </Pressable>
      ) : null}
    </View>
  );

  if (useMenu) {
    return rowBody;
  }

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <TripRowActions
          isPast={isPast}
          onComplete={onComplete}
          onReopen={onReopen}
          onDelete={onDelete}
        />
      )}
    >
      {rowBody}
    </Swipeable>
  );
}

function TripActionMenu({ plan, isPast, onClose, onComplete, onReopen, onDelete }) {
  if (!plan) {
    return null;
  }

  return (
    <View style={styles.menuOverlay} pointerEvents="box-none">
      <Pressable style={styles.menuBackdrop} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={styles.menuCard}>
        <Text style={styles.menuTitle} numberOfLines={2}>
          {plan.title}
        </Text>
        {isPast ? (
          <ShadePressable
            accessibilityRole="button"
            accessibilityLabel="Reopen trip"
            onPress={() => {
              onClose();
              onReopen();
            }}
            style={styles.menuItem}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.blue} />
            <Text style={styles.menuItemText}>Reopen</Text>
          </ShadePressable>
        ) : (
          <ShadePressable
            accessibilityRole="button"
            accessibilityLabel="Mark trip complete"
            onPress={() => {
              onClose();
              onComplete();
            }}
            style={styles.menuItem}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.green} />
            <Text style={styles.menuItemText}>Mark complete</Text>
          </ShadePressable>
        )}
        <ShadePressable
          accessibilityRole="button"
          accessibilityLabel="Delete trip"
          onPress={() => {
            onClose();
            onDelete();
          }}
          style={styles.menuItem}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.coral} />
          <Text style={[styles.menuItemText, styles.menuItemDanger]}>Delete</Text>
        </ShadePressable>
        <ShadePressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onClose}
          style={[styles.menuItem, styles.menuCancel]}
        >
          <Text style={styles.menuCancelText}>Cancel</Text>
        </ShadePressable>
      </View>
    </View>
  );
}

function DeleteConfirmDialog({ plan, onClose, onConfirm }) {
  if (!plan) {
    return null;
  }

  return (
    <View style={styles.menuOverlay} pointerEvents="box-none">
      <Pressable style={styles.menuBackdrop} onPress={onClose} accessibilityLabel="Cancel delete" />
      <View style={styles.menuCard}>
        <Text style={styles.menuTitle}>Delete trip?</Text>
        <Text style={styles.confirmBody}>
          &quot;{plan.title}&quot; will be permanently deleted. This cannot be undone.
        </Text>
        <ShadePressable
          accessibilityRole="button"
          accessibilityLabel="Confirm delete trip"
          onPress={() => {
            onClose();
            onConfirm();
          }}
          style={[styles.menuItem, styles.confirmDelete]}
        >
          <Text style={[styles.menuItemText, styles.menuItemDanger]}>Delete</Text>
        </ShadePressable>
        <ShadePressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onClose}
          style={[styles.menuItem, styles.menuCancel]}
        >
          <Text style={styles.menuCancelText}>Cancel</Text>
        </ShadePressable>
      </View>
    </View>
  );
}

export default function TripSwitcherSheet({
  visible,
  currentPlanId,
  activePlans,
  pastPlans,
  loading,
  error,
  onClose,
  onCreateTrip,
  onSelectPlan,
  onCompletePlan,
  onReopenPlan,
  onDeletePlan,
  onRetry,
}) {
  const [showPast, setShowPast] = useState(false);
  const [menuTarget, setMenuTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const useMenu = Platform.OS === "web";

  useEffect(() => {
    if (!visible) {
      setShowPast(false);
      setMenuTarget(null);
      setDeleteTarget(null);
    }
  }, [visible]);

  const requestDelete = useCallback((plan) => {
    setDeleteTarget(plan);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close trip switcher" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Your trips</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create trip"
            onPress={onCreateTrip}
            style={styles.createButton}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create trip</Text>
          </Pressable>

          {loading ? (
            <View style={styles.statusBlock}>
              <ActivityIndicator color={COLORS.blue} />
              <Text style={styles.statusText}>Loading trips…</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.statusBlock}>
              <Text style={styles.statusText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading trips"
                onPress={onRetry}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !error ? (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {activePlans.length === 0 ? (
                <Text style={styles.emptyHint}>No active trips. Create one to get started.</Text>
              ) : (
                activePlans.map((plan) => (
                  <TripRow
                    key={plan.id}
                    plan={plan}
                    selected={String(plan.id) === String(currentPlanId)}
                    isPast={false}
                    useMenu={useMenu}
                    onSelect={() => onSelectPlan(plan)}
                    onOpenMenu={() => setMenuTarget({ plan, isPast: false })}
                    onComplete={() => onCompletePlan(plan)}
                    onReopen={() => onReopenPlan(plan)}
                    onDelete={() => requestDelete(plan)}
                  />
                ))
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPast ? "Hide past trips" : "Show past trips"}
                onPress={() => setShowPast((value) => !value)}
                style={styles.pastToggle}
              >
                <Text style={styles.pastToggleText}>
                  Past trips{pastPlans.length ? ` (${pastPlans.length})` : ""}
                </Text>
                <Ionicons
                  name={showPast ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.blue}
                />
              </Pressable>

              {showPast ? (
                pastPlans.length === 0 ? (
                  <Text style={styles.emptyHint}>No past trips yet.</Text>
                ) : (
                  pastPlans.map((plan) => (
                    <TripRow
                      key={plan.id}
                      plan={plan}
                      selected={String(plan.id) === String(currentPlanId)}
                      isPast
                      useMenu={useMenu}
                      onSelect={() => onSelectPlan(plan)}
                      onOpenMenu={() => setMenuTarget({ plan, isPast: true })}
                      onComplete={() => onCompletePlan(plan)}
                      onReopen={() => onReopenPlan(plan)}
                      onDelete={() => requestDelete(plan)}
                    />
                  ))
                )
              ) : null}
            </ScrollView>
          ) : null}
        </View>

        <TripActionMenu
          plan={menuTarget?.plan}
          isPast={Boolean(menuTarget?.isPast)}
          onClose={() => setMenuTarget(null)}
          onComplete={() => menuTarget && onCompletePlan(menuTarget.plan)}
          onReopen={() => menuTarget && onReopenPlan(menuTarget.plan)}
          onDelete={() => menuTarget && requestDelete(menuTarget.plan)}
        />

        <DeleteConfirmDialog
          plan={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && onDeletePlan(deleteTarget)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(16, 33, 59, 0.35)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: "78%",
    backgroundColor: COLORS.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D5DEEC",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.blue,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.muted,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  rowSelected: {
    backgroundColor: "#E4EEFF",
    borderWidth: 1,
    borderColor: "#B7D0FF",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  coverThumb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#D5DEEC",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.subtext,
    fontWeight: "500",
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 20,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 33, 59, 0.45)",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  confirmBody: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  menuItemDanger: {
    color: COLORS.coral,
  },
  confirmDelete: {
    backgroundColor: "#FFECEA",
  },
  menuCancel: {
    justifyContent: "center",
    marginTop: 2,
  },
  menuCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.subtext,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 0,
  },
  shadePressable: {
    overflow: "hidden",
    position: "relative",
  },
  shadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  swipeAction: {
    width: 92,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 4,
    paddingHorizontal: 8,
  },
  swipeComplete: {
    backgroundColor: COLORS.green,
  },
  swipeReopen: {
    backgroundColor: COLORS.blue,
  },
  swipeDelete: {
    backgroundColor: COLORS.coral,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  swipeActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  pastToggleText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.blue,
  },
  statusBlock: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: "center",
  },
  retryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.subtext,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
